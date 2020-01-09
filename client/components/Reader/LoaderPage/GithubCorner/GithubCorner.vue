<template>
  <div id="vue-github-corner">
    <a  :href="url" id="github-corner" target="_blank" aria-label="View source on Github" >
      <svg  id="github-corner-svg"
            aria-hidden="true"
            viewBox="0 0 250 250" 
            :width="size" :height="size"
            :style="svgStyle" >
        <path :d="svgPath1" @mouseenter="flipColor" @mouseleave="flipColor"></path>
        <path :d="svgPath2" :style="gitStyle" class="octo-arm"></path>
        <path :d="svgPath3" :style="gitStyle" class="octo-body"></path>
      </svg>
    </a>
  </div>
</template>

<script>
  export default {
    name: 'GithubCorner',
    props: {
      url: {
        type: String,
        default: '/'
      },
      size: {
        type: Number,
        default: 80
      },
      colorScheme: {
        type: String,
        default: 'auto'
      },
      cornerColor: {
        type: String, 
        default: '#625D5D'
      },
      gitColor: {
        type: String,
        default: 'PeachPuff'
      },
      leftCorner: {
        type: Boolean,
        default: false
      },
      flipOnHover: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return {
        svgStyle: {
          fill: this.cornerColor,
          right: (this.leftCorner ? 'auto' : '0'),
          left: (this.leftCorner ? '0' : 'auto'),
          transform: (this.leftCorner ? 'scale(-1, 1)' : 'none')
        },
        gitStyle: {
          fill: this.gitColor
        },
        flipped: false,
        svgPath1: 'M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z',
        svgPath2: 'M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2',
        svgPath3: 'M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z'
      }
    },
    methods: {
      flipColor: function() {
        if (this.flipOnHover) {
          let holdSvgFill = this.svgStyle.fill
          this.svgStyle.fill = this.gitStyle.fill
          this.gitStyle.fill = holdSvgFill
        }
      }
    },
    beforeMount: function() {
      if (this.colorScheme != 'auto') {
        let sch = this.colorScheme
        this.gitStyle.fill = '#fff'

        if (sch.toLowerCase() == 'black') {
          this.svgStyle.fill = '#151513'
        } 
        if (sch.toLowerCase() == 'green') {
          this.svgStyle.fill = '#64CEAA'
        }
        if (sch.toLowerCase() == 'red') {
          this.svgStyle.fill = '#FD6C6C'
        }
        if (sch.toLowerCase() == 'blue') {
          this.svgStyle.fill = '#70B7FD'
        }
        if (sch.toLowerCase() == 'white') {
          this.svgStyle.fill = '#fff'
          this.gitStyle.fill = '#151513'
        }
      }
    }
  }
</script>

<style>
  #github-corner .octo-arm {
    transform-origin: 130px 106px
  }
  #github-corner:hover .octo-arm {
    animation: octocat-wave 560ms ease-in-out;
  }

  @keyframes octocat-wave {
    0% { transform: rotate(0deg); }
    20% { transform: rotate(-25deg); }
    40% { transform: rotate(10deg); }
    60% { transform: rotate(-25deg); }
    80% { transform: rotate(10deg); }
    100% { transform: rotate(0deg); }
  }

  #github-corner-svg {
    color: #fff;
    position: absolute;
    top: 0;
    border: 0;
  }
    #github-corner-svg, #github-corner-svg .octo-arm, #github-corner-svg .octo-body {
      transition: fill 1s ease;
    }
</style>
