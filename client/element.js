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

import ElTooltip from 'element-ui/lib/tooltip';
import './theme/tooltip.css';

import ElCol from 'element-ui/lib/col';
import './theme/col.css';

import ElContainer from 'element-ui/lib/container';
import './theme/container.css';

import ElAside from 'element-ui/lib/aside';
import './theme/aside.css';

import ElHeader from 'element-ui/lib/header';
import './theme/header.css';

import ElMain from 'element-ui/lib/main';
import './theme/main.css';

import ElInput from 'element-ui/lib/input';
import './theme/input.css';

import ElInputNumber from 'element-ui/lib/input-number';
import './theme/input-number.css';

import ElSelect from 'element-ui/lib/select';
import './theme/select.css';

import ElOption from 'element-ui/lib/option';
import './theme/option.css';

import ElTable from 'element-ui/lib/table';
import './theme/table.css';

import ElTableColumn from 'element-ui/lib/table-column';
import './theme/table-column.css';

import ElProgress from 'element-ui/lib/progress';
import './theme/progress.css';

import ElSlider from 'element-ui/lib/slider';
import './theme/slider.css';

import ElForm from 'element-ui/lib/form';
import './theme/form.css';

import ElFormItem from 'element-ui/lib/form-item';
import './theme/form-item.css';

import ElColorPicker from 'element-ui/lib/color-picker';
import './theme/color-picker.css';

import Notification from 'element-ui/lib/notification';
import './theme/notification.css';

import Loading from 'element-ui/lib/loading';
import './theme/loading.css';

import MessageBox from 'element-ui/lib/message-box';
import './theme/message-box.css';

const components = {
    ElMenu, ElMenuItem, ElButton, ElCheckbox, ElTabs, ElTabPane, ElTooltip,
    ElCol, ElContainer, ElAside, ElMain, ElHeader,
    ElInput, ElInputNumber, ElSelect, ElOption, ElTable, ElTableColumn,
    ElProgress, ElSlider, ElForm, ElFormItem,
    ElColorPicker,
};

for (let name in components) {
    Vue.component(name, components[name]);
}

//Vue.use(Loading.directive);

Vue.prototype.$loading = Loading.service;
Vue.prototype.$msgbox = MessageBox;
Vue.prototype.$alert = MessageBox.alert;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;
Vue.prototype.$notify = Notification;
//Vue.prototype.$message = Message;

import lang from 'element-ui/lib/locale/lang/ru-RU';
import locale from 'element-ui/lib/locale';
locale.use(lang);
