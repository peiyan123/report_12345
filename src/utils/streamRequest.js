
// 根据sse协议解析流数据
const parseEventChunk = (chunk) => {
  if (!chunk.trim() || chunk.length === 0) {
    return [];
  }
  const eventList = [];

  chunk.split(/\n|\r\n|\r/).forEach((line) => {
    const index = line.indexOf(':');
    let field = '';
    let value = '';
    if (index > 0) {
      // 第一个冒号之前的，是协议头，需要记录
      const skip = (line[index + 1] === ' ') ? 2 : 1;
      field = line.substring(0, index);
      value = line.substring(index + index + 2 + skip);
    } else if (index < 0) {
      // Interpret the entire line as the field name, and use the empty string as the field value
      field = line;
      value = '';
    } else {
      // A colon is the first character. This is a comment; ignore it.
      return;
    }

    // 目前只有data协议头是需要处理的数据
    if (field === 'data') {
      try {
        const vParse = JSON.parse(value);
        eventList.push(vParse);
      } catch (error) {
        console.error('json parse error', value);
      }
    }
  });
  return eventList;
};

// 用生成器处理流
async function* streamSource(body) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  if (!reader) {
    throw new Error('Network response is not readable');
  }
  let lastPart = '';

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done } = await reader.read();
    console.log('done', done, 'value', value);

    if (done) {
      const eventInfo = parseEventChunk(lastPart);
      for (let j = 0; j < eventInfo.length; j += 1) {
        yield eventInfo[j];
      }
      break;
    }

    const parts = (lastPart + value).split(/(\r\n\r\n|\r\r|\n\n)/g);
    // 我们假设最后一个块可能因缓冲或其他网络效应而不完整，
    // 因此我们总是保存最后一部分以将其与下一个到来的数据包合并
    lastPart = parts.pop() || '';
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const eventInfo = parseEventChunk(part);
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (let j = 0; j < eventInfo.length; j += 1) {
        yield eventInfo[j];
      }
    }
  }
}

export async function getStreamReaderStr(body, onProcess) {
  const generator = streamSource(body);

  let resStr = '';
  let studioData = null;
  let hasStarted = false;

  for await (const info of generator) {
    if (info.answer) {
      if (!hasStarted) {
        hasStarted = true;
      }

      resStr += info.answer;

      onProcess(info.answer, info);
    } else if (info.type === 'DONE') {
      studioData = info.content ?? {};
    }
  }

  return {
    studioData,
    relatedData: [],
    message: resStr
  };
}

export default async function streamFetch(url, requestBody, onProgress, abortController) {
  return new Promise((resolve, reject) => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Apikey', 'cv4hipsfl93b530r02i0');

    const fetchOptions = {
      method: 'POST',
      headers: myHeaders,
      signal: abortController?.signal,
      body: JSON.stringify(requestBody),
      timeout: 100000,
    };

    window.fetch(url, fetchOptions)
    // 处理http status code
      .then(async (response) => {
        const isStream = response.headers.get('content-type')?.includes('text/event-stream');

        if (response.status === 200) {
          return {
            isStream,
            code: 200,
            data: isStream ? response.body : await response.json()
          };
        }

        return {
          isStream,
          code: response.status,
          data: {},
          msg: response.statusText
        };
      })
      .then((res) => {
        console.log('then data', res);
        if (res.code === 200) {
          // 流式输出分段返回
          if (res.isStream) {
            getStreamReaderStr(res.data, onProgress).then((value) => {
              console.log('resStr', value);
              resolve({
                code: res.code,
                message: value.message,
                data: value.studioData,
                related: value.relatedData,
              });
            });
          } else {
            resolve(res.data);
          }
        }
      })
      .catch((error) => {
        console.log('error', error, JSON.stringify(error));
        console.log('error.name', error.name);
        if (error.name === 'AbortError') {
          resolve({
            code: 300,
            error: 'cancel',
            msg: error.message
          });
        } else {
          resolve({
            code: 0,
            error: error.name,
            msg: error.message
          });
        }
      });
  });
}
