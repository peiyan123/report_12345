<template>
  <div class="content">
    <div class="issue" v-if="flowItem?.question">
      <div class="issue-cont">
        <span>{{ flowItem?.question }}</span>
      </div>
    </div>
    <div class="answer-content" v-if="flowItem?.answer || flowItem?.loading">
      <img class="logo" :src="IconImg" alt="" />
      <div class="answer">
        <p v-if="streamingAnswer" v-html="md.render(streamingAnswer)" />
        <p v-else-if="waitTip">我正在整理，请您耐心等待</p>
        <!-- <div v-if="!flowItem?.loading && !waitTip" @click="speak(streamingAnswer)">   <img class="voice_to_text" :src="VoiceImg" alt=""></div> -->
        <Loading v-if="flowItem?.loading" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import IconImg from '@/assets/12345/icon.png';
import Loading from '@/components/mLoading/index'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import VoiceImg from '@/assets/12345/voice.png';
const waitTip = ref(false)
const timer = ref(null)
const isReading = ref(false)
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  inputDisabled: {
    type: Boolean,
    default: false,
  },
})
function isMobile() {
  const userAgent = navigator.userAgent;
  console.log(userAgent)
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  console.log(mobileRegex.test(userAgent))
  return mobileRegex.test(userAgent);
}
function speak(text) {
  // 检查浏览器是否支持语音合成
  if (isReading.value) {
    return
  }
  if (!window.speechSynthesis) {
    console.error("你的浏览器不支持语音合成 API");
    return;
  } else {
    // 创建一个语音实例
    const utterance = new SpeechSynthesisUtterance(text);
    // 可选：配置语音参数
    utterance.rate = 2.5; // 语速（0.1 ~ 10）
    utterance.pitch = 1.0; // 音高（0 ~ 2）
    utterance.volume = 1.0; // 音量（0 ~ 1）
    utterance.lang = "zh-CN"; // 语言（'en-US', 'zh-CN', 'ja-JP' 等）

    // 播放语音
    window.speechSynthesis.speak(utterance);

    // 监听语音结束事件
    utterance.onend = () => {
      console.log("语音播放结束");
    };
  }

 
}

const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (err) {
        console.error('Highlight error:', err)
      }
    }
    return ''
  }
})

const emit = defineEmits(['smart', 'disable-input', 'enable-input']);

const flowItem = ref({})
const streamingAnswer = ref('')
const renderIndex = ref(0)

const streamRender = (answer) => {
  if (renderIndex.value < answer.length) {
    streamingAnswer.value += answer[renderIndex.value];
    renderIndex.value++;
    emit('disable-input');  // 禁用父组件的输入框
    timer.value = setTimeout(() => streamRender(answer), 10);
  } else {
    emit('enable-input');  // 启用父组件的输入框
  }
};

watch(() => props.data, (newVal) => {
  if (!newVal) return
  
  flowItem.value = { ...newVal }
  const answer = newVal.answer || ''
  
  // 清除旧内容
  streamingAnswer.value = ''
  renderIndex.value = 0
  clearTimeout(timer.value)

  if (answer) {
    waitTip.value = false
    streamRender(answer)
  }
}, { deep: true, immediate: true })

onMounted(() => {
  isMobile()
  timer.value = setTimeout(() => {
    waitTip.value = true
  }, 8000)
})
</script>
<style scoped lang="less">
.content {
  padding: 0 12px;
}
.issue {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  margin-top: 16px;
  &-cont {
    padding: 10px 12px;
    border-radius: 10px;
    background: #4A75F3;; 
    width: fit-content;
    span {
      color: #FFF;
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 160%;
      letter-spacing: 0.2px;
    }
  }
}
.answer-content {
  display: flex;
  align-items: flex-start;
  .logo {
    width: 35px;
    height: 35px;
    display: inline-block;
    margin-right: 8px
  }
}
.answer {
  border-radius: 10px;
  background: #F3F4F6;
  padding: 10px 12px;
  margin-bottom: 16px;

  :deep(p) {
    margin: 3px 0;
  }

  :deep(p > p) {
    margin: 12px 0;
    overflow-wrap: break-word;
  }

  :deep(ol) {
    padding-left: 18px;
  }

  :deep(ul) {
    padding-left: 10px;
  }
  
  :deep(ul > li) {
    margin: 5px 0;
  }

  :deep(img) {
    display: inline-block;
    width: 100%;
    height: auto;
  }

  :deep(h2 + p) {
    color: #9E9E9E;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 160%;
    letter-spacing: 0.2px;
    margin: 4px 0 10px;
  }

  :deep(h2 + p + p) {
    color: #212121;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 190%;
  }

  :deep(a) {
    color: #409eff;
    text-decoration: none;
    font-style: normal;
  }
  
  :deep(h2) {
    color: #212121;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 160%;
    letter-spacing: 0.2px;
    margin: 0;
  }
  h3 {
    color: #212121;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 160%;
    letter-spacing: 0.2px;
    margin: 0;
  }
  .sub {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    span {
      color: #9E9E9E;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 160%;
      letter-spacing: 0.2px;
    }
  }
  &-cont {
    color: #212121;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 190%;
    letter-spacing: 0.2px;
  }
  .relate {
    margin-top: 12px;
    label {
      display: block;
      color: #9E9E9E;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 160%;
      letter-spacing: 0.2px;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        margin-top: 8px;
        padding: 8px 12px;
        border-radius: 4px;
        background: #FAFAFA;
        color: #616161;
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 160%;
        letter-spacing: 0.2px;
      }
    }
  }
}
.voice_to_text {
  width: 25px !important;
}
</style>