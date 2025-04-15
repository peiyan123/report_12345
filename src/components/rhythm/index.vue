<template>
  <div class="rhythm">
    <div class="wrap" v-for="n in 7" :key="n">
      <span class="r-1"></span>
      <span class="r-2"></span>
      <span class="r-3"></span>
    </div>
    <div class="wrap">
      <span class="r-2"></span>
      <span class="r-1"></span>
    </div>
  </div>
</template>
<style scope lang="less">
.rhythm {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50px;
  border-radius: 22px;
  background: #4A75F3;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: -5px;
  span {
    margin-right: 5px;
  }
  .wrap {
    margin-top: -10px;
  }
  .r-1 {
    display: inline-block;
    width: 3px;
    height: 10px;
    border-radius: 3px;
    background: #FFF;
    animation: change1 300ms infinite ease-in-out; 
  }
  .r-2 {
    display: inline-block;
    width: 3px;
    height: 13px;
    border-radius: 3px;
    background: #FFF; 
    animation: change2 600ms infinite ease-in-out;   
  }
  .r-3 {
    display: inline-block;
    width: 3px;
    height: 18px;
    border-radius: 3px;
    background: #FFF;
    animation: change3 900ms infinite ease-in-out;   
  }
}
@keyframes change1 {
  from {
    transform: translateY(5px);
    height: 12px;
  }
  to {
    transform: translateY(2px);
    height: 5px;
  }
}
@keyframes change2 {
  from {
    transform: translateY(7px);
    height: 15px;
  }
  to {
    transform: translateY(3px);
    height: 7px;
  }
}
@keyframes change3 {
  from {
    transform: translateY(9px);
    height: 20px;
  }
  to {
    transform: translateY(4px);
    height: 10px;
  }
}
@keyframes change1 {
  from {
    transform: translateY(5px);
    height: 12px;
  }
  to {
    transform: translateY(2px);
    height: 5px;
  }
}
@keyframes change2 {
  from {
    transform: translateY(7px);
    height: 15px;
  }
  to {
    transform: translateY(3px);
    height: 7px;
  }
}
@keyframes change3 {
  from {
    transform: translateY(9px);
    height: 20px;
  }
  to {
    transform: translateY(4px);
    height: 10px;
  }
}
@-webkit-keyframes change1 {
  from {
    transform: translateY(5px);
    height: 12px;
  }
  to {
    transform: translateY(2px);
    height: 5px;
  }
}
@-webkit-keyframes change2 {
  from {
    transform: translateY(7px);
    height: 15px;
  }
  to {
    transform: translateY(3px);
    height: 7px;
  }
}
@-webkit-keyframes change3 {
  from {
    transform: translateY(9px);
    height: 20px;
  }
  to {
    transform: translateY(4px);
    height: 10px;
  }
}
</style>