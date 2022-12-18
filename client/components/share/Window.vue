<template>
    <div ref="main" class="main xyfit absolute" @click="close" @mouseup="onMouseUp" @mousemove="onMouseMove">
        <div ref="windowBox" class="xyfit absolute flex no-wrap" @click.stop>
            <div ref="window" class="window flexfit column no-wrap">
                <div 
                    ref="header"
                    class="header row justify-end"
                    @mousedown.prevent.stop="onMouseDown"
                    @touchstart.stop="onTouchStart"
                    @touchend.stop="onTouchEnd"
                    @touchmove.stop="onTouchMove"
                >
                    <div class="header-text col" style="width: 0">
                        <slot name="header"></slot>
                    </div>
                    <slot name="buttons"></slot>
                    <span class="close-button row justify-center items-center" @mousedown.stop @click="close"><q-icon name="la la-times" size="16px" /></span>
                </div>

                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../vueComponent.js';

class Window {
    _props = {
        height: { type: String, default: '100%' },
        width: { type: String, default: '100%' },
        maxWidth: { type: String, default: '' },
        topShift: { type: Number, default: 0 },
        margin: '',
    };

    init() {
        this.$nextTick(() => {
            this.$refs.main.style.top = 0;
            this.$refs.main.style.left = 0;

            this.$refs.windowBox.style.height = this.height;
            this.$refs.windowBox.style.width = this.width;
            if (this.maxWidth)
                this.$refs.windowBox.style.maxWidth = this.maxWidth;

            const left = (this.$refs.main.offsetWidth - this.$refs.windowBox.offsetWidth)/2;
            const top = (this.$refs.main.offsetHeight - this.$refs.windowBox.offsetHeight)/2 + this.topShift;
            this.$refs.windowBox.style.left = (left > 0 ? left : 0) + 'px';
            this.$refs.windowBox.style.top = (top > 0 ? top : 0) + 'px';

            if (this.margin)
                this.$refs.window.style.margin = this.margin;
        });
    }

    onMouseDown(event) {
        if (this.$root.isMobileDevice)
            return;
        if (event.button == 0) {
            this.$refs.header.style.cursor = 'move';
            this.startX = event.screenX;
            this.startY = event.screenY;
            this.moving = true;
        }
    }

    onMouseUp(event) {
        if (event.button == 0) {
            this.$refs.header.style.cursor = 'default';
            this.moving = false;
        }
    }

    onMouseMove(event) {
        if (this.moving) {
            const deltaX = event.screenX - this.startX;
            const deltaY = event.screenY - this.startY;
            this.startX = event.screenX;
            this.startY = event.screenY;

            this.$refs.windowBox.style.left = (this.$refs.windowBox.offsetLeft + deltaX) + 'px';
            this.$refs.windowBox.style.top = (this.$refs.windowBox.offsetTop + deltaY) + 'px';
        }
    }

    onTouchStart(event) {
        if (!this.$root.isMobileDevice)
            return;
        if (event.touches.length == 1) {
            const touch = event.touches[0];
            this.$refs.header.style.cursor = 'move';
            this.startX = touch.screenX;
            this.startY = touch.screenY;
            this.moving = true;
        }
    }

    onTouchMove(event) {
        if (!this.$root.isMobileDevice)
            return;
        if (event.touches.length == 1 && this.moving) {
            const touch = event.touches[0];
            const deltaX = touch.screenX - this.startX;
            const deltaY = touch.screenY - this.startY;
            this.startX = touch.screenX;
            this.startY = touch.screenY;

            this.$refs.windowBox.style.left = (this.$refs.windowBox.offsetLeft + deltaX) + 'px';
            this.$refs.windowBox.style.top = (this.$refs.windowBox.offsetTop + deltaY) + 'px';
        }
    }

    onTouchEnd() {
        if (!this.$root.isMobileDevice)
            return;
        this.$refs.header.style.cursor = 'default';
        this.moving = false;
    }


    close() {
        if (!this.moving)
            this.$emit('close');
    }
}

export default vueComponent(Window);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    background-color: transparent !important;
    z-index: 50;
}

.xyfit {
    height: 100%;
    width: 100%;
}

.flexfit {
    flex: 1;
}

.window {
    margin: 10px;
    background-color: #ffffff;
    border: 3px double black;
    border-radius: 4px;
    box-shadow: 3px 3px 5px black;
}

.header {
    background: linear-gradient(to bottom right, #007000, #59B04F);
    align-items: center;
    height: 30px;
}

.header-text {
    margin-left: 10px;
    margin-right: 10px;
    color: #FFFFA0;
    text-shadow: 2px 2px 5px #005000, 2px 1px 5px #005000;
    overflow: hidden;
    white-space: nowrap;
}

.close-button {
    width: 30px;
    height: 30px;
    cursor: pointer;
}

.close-button:hover {
    color: white;
    background-color: #FF3030;
}

</style>
