/* eslint-disable no-undef */
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {},
          javascriptEnabled: true
        },
      },
    },
  },
  configureWebpack: config => {    
    //生产环境取消 console.log    
    if (process.env.NODE_ENV === 'production') {      
      /* 压缩打包 */
      config.optimization.splitChunks.chunks = 'all';        
      config.optimization.splitChunks.minSize = 1000000;      
      config.optimization.splitChunks.maxSize = 3000000;    
    }  
  },
  devServer: {
    // https: true,
    proxy: {
      '/poc': {
        target: 'https://guowangtest.mynatapp.cc',
        changeOrigin: true,
        // rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
