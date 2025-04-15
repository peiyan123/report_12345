<template>
  <div class="container">
    <div class="header">
      <div class="left">
        <img :src="FoldImg" alt="" @click="onHistory">
      </div>
      <div class="center">
        <img :src="TitleImg" alt="" @click="onSearch">
      </div>
      <div class="right"></div>
    </div>
    <div class="logo" v-if="chartFlow.data?.filter((f) => f.time == timeLine)?.length === 0">
      <img :src="LogoImg" alt="">
    </div>
    <div class="hi" v-if="chartFlow.data?.filter((f) => f.time == timeLine)?.length === 0">
      <h2>HI！我是12345，很高兴为您服务</h2>
      <p>您好，请问您需要什么帮助？</p>
    </div>
    <div v-for="(item, index) in chartFlow.data.filter((f) => f.time == timeLine)" :key="index">
      <Template :data="item" :loading="loading" :issue="issueContent"  @disable-input="disableInput" @enable-input="enableInput" @smart="onSmart" />
    </div>
    <div class="ask">
      <div class="cont" v-if="voiceVisible">
        <el-input v-model="question" class="ask-ipt" placeholder="请输入你的问题" :disabled="inputDisabled" />
        <img :class="['send', { disabled: loading }]" :src="SendImg" alt="提问" v-if="!!question" @click="send">
        <img class="voice" :src="VoiceImg" alt="" @click="switchVoice">
      </div>
      <div 
        class="cont btn custom-loading-svg"
        v-loading="loading"
        element-loading-text="正在识别中，请稍后"
        v-else
        :disabled="loading"
      >
        <img class="keyboard" :src="KeyboardImg" alt="" @click="voiceVisible = true">
        <div class="voice-btn">按住 说话</div>
        <Rhythm v-if="!!rhythmVisible" />
      </div>
    </div>
    <el-drawer class="history" v-model="visible" :show-close="false" direction="ltr">
      <template #header="{ titleId, titleClass }">
        <div :id="titleId" :class="titleClass">
          <img :src="LogoImg" alt="">
          <h4>Hi! 我是京京</h4>
        </div>
      </template>
      <div class="history-btn" @click="onRefresh">
        <img :src="ChartImg" alt="">
        <span>新的会话</span>
      </div>
      <div class="history-list">
        <h5>历史记录</h5>
        <ul v-if="historyList.length > 0">
          <li v-for="item in historyList" :key="item.QueryID" @click="onRegain(item)">{{ item.Query }}</li>
        </ul>
        <div class="empty" v-else>
          <img :src="EmptyImg" alt="">
          <span>暂无历史</span>
          <p>快去开启新的对话吧～</p>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script setup>
import { h, onMounted, onUnmounted, reactive, ref, computed } from 'vue';
import LogoImg from '@/assets/12345/icon.png';
import SendImg from '@/assets/12345/send.png';
import FoldImg from '@/assets/12345/fold.png';
import EmptyImg from '@/assets/12345/empty.png';
import VoiceImg from '@/assets/12345/voice.png';
import KeyboardImg from '@/assets/12345/keyboard.png';
import ChartImg from '@/assets/12345/chart.png';
import TitleImg from '@/assets/12345/title.png';
import streamFetch from '@/utils/streamRequest';
import { getUuid } from '@/utils/uuid';
import Template from '@/components/mTemplate/index';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import Rhythm from '@/components/rhythm/index.vue';
import Recorder from 'recorder-core';
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';

const question = ref('');
const issueContent = ref('');
const visible = ref(false);
const voiceVisible = ref(true);
const rhythmVisible = ref(false);
const strTxt = reactive({content: ''});
const timer = ref(null);
let chartFlow = reactive({data: []});
const currentIndex = ref(0);
const uuid = ref('');
const speakTxt = ref('');
const appConversationID = ref('');
const conversationID = ref('');
const messageId = ref('');
const historyList = ref([]);
const mediaRecorder = ref(null);
const streamBlob = ref(null);
const audioSrc = ref('');
const loading = ref(false);
const inputDisabled = ref(false);
const currentTaskId = ref('');
const timeLine = ref(0);
const uploadVoice = async (blob) => {
  try {
    loading.value = true;
    const form  = new FormData();
    form.append("file", blob, "recorder.mp3");

    const res = await axios.post('https://guowangtest.mynatapp.cc/websocket ', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })

    if (res.data.result) {
      question.value = res.data.result;
      loading.value = false;
      send();
    } else {
      ElMessage.error('语音识别异常，请重试');
    }
  } catch (error) {
    loading.value = false;
    console.log(error);
  }
}

const disableInput = () => {
  inputDisabled.value = true;
};

const enableInput = () => {
  inputDisabled.value = false;
};

const createChart = async () => {
  timeLine.value = new Date().getTime()
  // uuid
  uuid.value = localStorage.getItem('uuid') ? localStorage.getItem('uuid') : getUuid();
  localStorage.setItem('uuid', uuid.value);
  
  try {
    const res = await axios.post('/poc/v1/create_conversation', {
      AppKey: 'cv0hm57aeetqe3ld7crg',
      "Inputs": {
        "var": "1"
      },
      userId: uuid.value,
    }, {
      headers: {
        'Content-Type': 'application/json;',
        'Apikey': 'cv4hipsfl93b530r02i0'
      }
    })
    appConversationID.value = res.data.Conversation.AppConversationID;
  } catch (error) {
    ElMessage.error('创建会话失败');
  }
}

const fetchChart = async (flag = false) => {
  try {
    await streamFetch('/poc/v1/chat_query', {
      AppKey: 'cv0hm57aeetqe3ld7crg',
      AppConversationID: appConversationID.value,
      userId: uuid.value,
      Query: issueContent.value,
      ResponseMode: 'streaming',
      ConversationID: conversationID.value || undefined,
    }, (text, info) => {
      if (flag) return true;

      strTxt.content += text;
      chartFlow.data[currentIndex.value] = {
        ...chartFlow.data[currentIndex.value],
        answer: strTxt.content,
      };
      messageId.value = info.id;
      currentTaskId.value = info.task_id;
      conversationID.value = info.conversation_id;
      
      scrollTo();
    });
    chartFlow.data[currentIndex.value] = {
      ...chartFlow.data[currentIndex.value],
      question: issueContent.value,
      loading: false,
    }
    scrollTo();
    currentIndex.value++;
    // 全局新窗口打开
    const AEle = document.querySelectorAll('a')
    if (AEle.length > 0) {
      AEle.forEach(item => item.setAttribute('target', '_blank'))
    }
  } catch (error) {
    console.log(error)
    chartFlow.data[currentIndex.value] = {
      answer: '网络异常，请稍后重试',
      loading: false,
    }
  }
}

const fetchHistory = async () => {
  try {
    const res = await axios.post('/poc/v1/get_conversation_messages', {
      AppKey: 'cv0hm57aeetqe3ld7crg',
      AppConversationID: appConversationID.value,
      Limit: 10,
      userId: uuid.value,
    }, {
      headers: {
        'Content-Type': 'application/json;',
        'Apikey': 'cv4hipsfl93b530r02i0'
      }
    })
    historyList.value = res.data.Messages;
  } catch (error) {
    console.log(error)
  }
}

const onHistory = async () => {
  visible.value = true;
  await fetchHistory();
}

const scrollTo = () => {
  document.querySelector('.container')?.scrollTo({
    top: document.querySelector('.container').scrollHeight,
    behavior: "smooth",
  });
}

const onSpeak = () => {
    // stream对象代表用户的声音输入
    // 在这里我们可以进行后续的处理
    rhythmVisible.value = true;
    // 创建 MediaRecorder 实例
    // 开始录制
    if (mediaRecorder.value) {
      mediaRecorder.value.start();
    }
}

const stopSpeak = () => {
  rhythmVisible.value = false;
  // 录制语音请求服务器版本
  // 录制完成后停止
  if (mediaRecorder.value) {
    mediaRecorder.value.stop(async (blob, duration) => {
      streamBlob.value = blob;
      // eslint-disable-next-line no-undef
      const audioURL = (window.URL || webkitURL).createObjectURL(blob);
      console.log("录音成功", blob, audioURL, "时长:" + duration + "ms");
      audioSrc.value = audioURL;
      // 上传录音
      await uploadVoice(blob);
    }); 
  }
}

const send = async () => {
  disableInput()
  issueContent.value = question.value;

  chartFlow.data[currentIndex.value] = {
    question: issueContent.value,
    answer: null,
    loading: true,
    time: timeLine.value
  };

  strTxt.content = '';
  question.value = '';
  timer.value = setTimeout(() => {
    scrollTo();
    clearTimeout(timer.value);
  }, 300);

  if (issueContent.value.substring(0, 4) == '确认无误') {
    // 特殊上下文处理
    const timer = setTimeout(() => {
      chartFlow.data[currentIndex.value] = {
        ...chartFlow.data[currentIndex.value],
        answer: '您的问题已做记录，请耐心等待，后续办理情况可在“个人中心”查看，感谢您的访问，祝您生活愉快，再见',
        loading: false,
      };
      clearTimeout(timer);
      return;
    }, 5000);
    await fetchChart(true);
  } else {
    await fetchChart();
  }
};

const onRefresh = async () => {
  enableInput();
  // 清空
  speakTxt.value = '';
  messageId.value = '';
  conversationID.value = '';
  appConversationID.value = '';
  currentIndex.value = 0;
  chartFlow.data = [];

  visible.value = false;
 
  await createChart();
}

const onRegain = async (item) => {
  await onRefresh();
  conversationID.value = item.ConversationID;
  question.value = item.Query;
  await send();
}

const onSmart = (txt) => {
  question.value = txt;
}

// 初始化语音识别
const initSpeak = () => {
  const speakBtn = document.querySelector('.voice-btn');
  speakBtn?.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onSpeak();
    console.log('触摸按下');
  });

  speakBtn?.addEventListener('touchend', (event) => {
    event.preventDefault();
    stopSpeak();
    console.log('触摸抬起');
  });
}

const switchVoice = () => {
  voiceVisible.value = false;
  timer.value = setTimeout(() => {
    initSpeak()
  }, 600);
}

onUnmounted(() => {
  if (mediaRecorder.value) {
    mediaRecorder.value.close();
    mediaRecorder.value = null;
  }
  clearTimeout(timer.value);
})

onMounted(async () => {
  // 初始化新的会话
  await createChart()
  // 获取麦克风权限
  mediaRecorder.value = Recorder({
		type:"mp3",
		sampleRate: 48000, //录音的采样率，越大细节越丰富越细腻
		bitRate: 32, //录音的比特率，越大音质越好
		onProcess: (buffers, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx, asyncEnd) => {}
	});

  mediaRecorder.value.open(() => {
    console.log('录音设备已准备好');
  }, (msg, isUserNotAllow) => {
    //用户拒绝了录音权限，或者浏览器不支持录音
		console.log((isUserNotAllow ? "UserNotAllow," : "") + "无法录音:" + msg);
    ElMessage.error('请先开启麦克风权限')
  })
  // if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  //   stream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
  //   voicePermission.value = true;
  // } else {
  //   ElMessage.warning('当前环境不支持语音输入，请使用键盘模式咨询');
  //   voicePermission.value = false;
  // }
})
</script>
<style scoped lang="less">
.container {
  padding-top: 50px;
  width: 100%;
  background-color: #FFF;
  height: calc(100vh - 98px);
  overflow-y: auto;
  :deep(.history.el-drawer) {
    overflow: hidden;
    padding: 16px;
  }
  :deep(.el-loading-mask) {
    border-radius: 22px;
  }
  :deep(.el-loading-spinner) {
    margin-top: -10px;
    display: flex;
    justify-content: center;
    align-items: center;
    .circular {
      height: 20px;
      width: 20px;
      margin-right: 4px;
    }
  }
  .header {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    width: 100%;
    height: 50px;
    background: url('@/assets/12345/top-bg.png') no-repeat;
    background-position: 0 0;
    background-size: cover;
    .left {
      img {
        display: block;
        width: 26px;
        height: 26px;
      }
    }
    .center {
      margin-left: -26px;
      img {
        width: 88px;
        height: 19px;
      }
    }
  }
  .logo {
    margin-top: 150px;
    img {
      display: block;
      height: 84px;
      width: 84px;
      margin: 0 auto;
    }
  }
  .hi {
    width: 100%;
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.64) 0%, rgba(255, 255, 255, 0.00) 100%);
    backdrop-filter: blur(22px);
    padding: 16px 36px;
    h2 {
      color: #000;
      text-align: center;
      font-size: 18px;
      font-style: normal;
      font-weight: 600;
      line-height: normal;
      margin: 0;
    }
    p {
      color: rgba(0, 0, 0, 0.70);
      text-align: left;
      font-size: 14px;
      font-style: normal;
      font-weight: 300;
      line-height: normal;
      margin-top: 20px;
      line-height: 160%;
    }
  }
  .refresh {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    position: absolute;
    width: calc(100% - 24px);
    background: linear-gradient(180deg, rgba(255, 246, 239, 0.00) 0%, #FFF6EF 100%);
    padding: 10px 16px;
    bottom: 70px;
    .btn {
      display: flex;
      align-items: center;
      border-radius: 4px;
      border: 1px solid #EC2628;
      background: #FFF;
      padding: 4px 12px;
      img {
        display: inline-block;
        width: 15px;
        height: 15px;
        margin-right: 4px;
      }
      span {
        font-size: 14px;
        font-style: normal;
        font-weight: 500;
        line-height: 24px;
        background: linear-gradient(57deg, #EC2628 2.45%, #FA7C55 97.82%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }
  .ask {
    position: absolute;
    width: 100%;
    padding: 24px 16px;
    bottom: 0;
    background: #FFF;
    box-shadow: 0px -1px 2px 0px rgba(28, 47, 101, 0.10);
    .cont {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      &.btn {
        position: relative;
        height: 54px;
        border-radius: 22px;
        background: #F3F4F6;
      }
      .voice-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(0, 0, 0, 0.90);
        font-size: 16px;
        font-style: normal;
        font-weight: 500;
        line-height: normal;
        user-select: none; /* 对现代浏览器 */
        -webkit-user-select: none; /* 对 Safari */
        -moz-user-select: none; /* 对 Firefox */
        -ms-user-select: none; /* 对 IE 和 Edge */
      }
      .ask-ipt {
        :deep(.el-input__wrapper) {
          border-radius: 27px;
          background: #F3F4F6;
          padding: 12px 52px 12px 40px; 
          box-shadow: none;
        }
        :deep(.el-input__inner) {
          color: rgba(0, 0, 0, 0.60);
          font-size: 16px;
          font-style: normal;
          font-weight: 400;
          line-height: 160%;
          letter-spacing: 0.2px;
          text-indent: 6px;
        }
      }
      .voice {
        display: inline-block;
        width: 24px;
        height: 24px;
        position: absolute;
        left: 13px;
      }
      .keyboard {
        display: inline-block;
        width: 24px;
        height: 24px;
        position: absolute;
        left: 13px;
      }
      .send {
        display: inline-block;
        width: 24px;
        height: 24px;
        position: absolute;
        right: 13px;
        cursor: pointer;
        .disabled {
            opacity: 0.5;
            pointer-events: none;
        }
      }
    }
  }
  :deep(.history) {
    width: 260px !important;
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
    .el-drawer__header {
      padding: 0;
      margin-bottom: 16px;
      .el-drawer__title {
        display: flex;
        align-items: center;
        img {
          width: 35px;
          height: 35px;
          display: inline-block;
          margin-right: 8px;
        }
        h4 {
          color: #000;
          font-size: 16px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          margin: 0;
        }
      }
    }
    .el-drawer__body {
      padding: 0;
    }
    .history-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 44px;
      border-radius: 20px;
      background: #F3F4F6;
      img {
        width: 24px;
        height: 24px;
        display: block;
        margin-right: 4px;
      }
      span {
        color: rgba(0, 0, 0, 0.60);
        font-size: 14px;
        font-style: normal;
        font-weight: 500;
        line-height: normal;
      }
    }
    .history-list {
      display: flex;
      flex-direction: column;
      margin-top: 40px;
      h5 {
        display: block;
        color: rgba(0, 0, 0, 0.40);
        font-size: 14px;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
        margin: 0 0 12px;
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        li {
          color: rgba(0, 0, 0, 0.90);
          font-weight: 400;
          height: 34px;
          line-height: 32px;
          overflow: hidden;
          &:active {
            border-radius: 20px;
            background: #F3F4F6;
            color: #4A75F3;
            font-weight: 500;
          }
        }
      }
      .empty {
        margin-top: 125px;
        img {
          width: 64px;
          height: 64px;
          display: block;
          margin: 0 auto;
        }
        span {
          display: block;
          width: 100%;
          color: rgba(0, 0, 0, 0.60);
          text-align: center;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          margin: 4px 0 16px;
        }
        p {
          color: rgba(0, 0, 0, 0.40);
          text-align: center;
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          margin: 0;
        }
      }
    }
  }
}
</style>