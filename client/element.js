import Vue from 'vue';

/*
import ElementUI from 'element-ui';
import './theme/index.css';
import locale from 'element-ui/lib/locale/lang/ru-RU';

Vue.use(ElementUI, { locale });
*/

//------------------------------------------------------
//import './theme/index.css';

import './theme/icon.css';
import './theme/tooltip.css';

import ElMenu from 'element-ui/lib/menu'; 
import './theme/menu.css';

import ElMenuItem from 'element-ui/lib/menu-item';
import './theme/menu-item.css';

import ElButton from 'element-ui/lib/button';
import './theme/button.css';

import ElCheckbox from 'element-ui/lib/checkbox';
import './theme/checkbox.css';

import ElTabs from 'element-ui/lib/tabs';
import './theme/tabs.css';

import ElTabPane from 'element-ui/lib/tab-pane';
import './theme/tab-pane.css';

import ElContainer from 'element-ui/lib/container';
import './theme/container.css';

import ElAside from 'element-ui/lib/aside';
import './theme/aside.css';

import ElHeader from 'element-ui/lib/header';
import './theme/header.css';

import ElMain from 'element-ui/lib/main';
import './theme/main.css';

const ElNotification = () => import('element-ui/lib/notification');
import './theme/notification.css';

const components = {
    ElMenu, ElMenuItem, ElButton, ElCheckbox, ElTabs, ElTabPane,
    ElContainer, ElAside, ElMain, ElHeader,
    ElNotification
};

for (let [name, comp] of Object.entries(components)) {
    Vue.component(name, comp);
}

//Vue.use(Loading.directive);

//Vue.prototype.$loading = Loading.service;
//Vue.prototype.$msgbox = MessageBox;
//Vue.prototype.$alert = MessageBox.alert;
//Vue.prototype.$confirm = MessageBox.confirm;
//Vue.prototype.$prompt = MessageBox.prompt;
Vue.prototype.$notify = Notification;
//Vue.prototype.$message = Message;

import locale from 'element-ui/lib/locale/lang/ru-RU';
Vue.prototype.$ELEMENT = { locale };
