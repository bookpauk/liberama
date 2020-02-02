<template>
    <div ref="main" class="main" @click="close" @mouseup="onMouseUp" @mousemove="onMouseMove">
        <div ref="windowBox" class="windowBox" @click.stop>
            <div class="window">
                <div ref="header" class="header" @mousedown.prevent.stop="onMouseDown"
                    @touchstart.stop="onTouchStart" @touchend.stop="onTouchEnd" @touchmove.stop="onTouchMove">
                    <span class="header-text"><slot name="header"></slot></span>
                    <span class="close-button" @mousedown.stop @click="close"><i class="el-icon-close"></i></span>
                </div>
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
    props: {
        height: { type: String, default: '100%' },
        width: { type: String, default: '100%' },
        maxWidth: { type: String, default: '' },
        topShift: { type: Number, default: 0 },
    }
})
class Window extends Vue {
    init() {
        this.$nextTick(() => {
            this.$refs.windowBox.style.height = this.height;
            this.$refs.windowBox.style.width = this.width;
            if (this.maxWidth)
                this.$refs.windowBox.style.maxWidth = this.maxWidth;

            const left = (this.$refs.main.offsetWidth - this.$refs.windowBox.offsetWidth)/2;
            const top = (this.$refs.main.offsetHeight - this.$refs.windowBox.offsetHeight)/2 + this.topShift;
            this.$refs.windowBox.style.left = (left > 0 ? left : 0) + 'px';
            this.$refs.windowBox.style.top = (top > 0 ? top : 0) + 'px';
        });
    }

    onMouseDown(event) {
        if (this.$isMobileDevice)
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
        if (!this.$isMobileDevice)
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
        if (!this.$isMobileDevice)
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
        if (!this.$isMobileDevice)
            return;
        this.$refs.header.style.cursor = 'default';
        this.moving = false;
    }


    close() {
        if (!this.moving)
            this.$emit('close');
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 50;
}

.windowBox {
    position: absolute;
    display: flex;
    height: 100%;
    width: 100%;
}

.window {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin: 10px;
    background-color: #ffffff;
    border: 3px double black;
    border-radius: 4px;
    box-shadow: 3px 3px 5px black;
}

.header {
    display: flex;
    justify-content: flex-end;
    background: linear-gradient(to bottom right, green, #59B04F);
    align-items: center;
    height: 30px;
}

.header-text {
    flex: 1;
    margin-left: 10px;
    margin-right: 10px;
    color: yellow;
    text-shadow: 2px 1px 5px black, 2px 2px 5px black;
}

.close-button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    cursor: pointer;
}

.close-button:hover {
    background-color: #69C05F;
}
</style>