import Vue from 'vue';

/*
import ElementUI from 'element-ui';
import './theme/index.css';
import locale from 'element-ui/lib/locale/lang/ru-RU';

Vue.use(ElementUI, { locale });
*/

//------------------------------------------------------
import './theme/index.css';

import ElMenu from 'element-ui/lib/menu'; 
import ElMenuItem from 'element-ui/lib/menu-item';
import ElButton from 'element-ui/lib/button';
import ElButtonGroup from 'element-ui/lib/button-group';
import ElCheckbox from 'element-ui/lib/checkbox';
import ElTabs from 'element-ui/lib/tabs';
import ElTabPane from 'element-ui/lib/tab-pane';
import ElTooltip from 'element-ui/lib/tooltip';
import ElCol from 'element-ui/lib/col';
import ElContainer from 'element-ui/lib/container';
import ElAside from 'element-ui/lib/aside';
import ElHeader from 'element-ui/lib/header';
import ElMain from 'element-ui/lib/main';
import ElInput from 'element-ui/lib/input';
import ElInputNumber from 'element-ui/lib/input-number';
import ElSelect from 'element-ui/lib/select';
import ElOption from 'element-ui/lib/option';
import ElTable from 'element-ui/lib/table';
import ElTableColumn from 'element-ui/lib/table-column';
import ElProgress from 'element-ui/lib/progress';
import ElSlider from 'element-ui/lib/slider';
import ElForm from 'element-ui/lib/form';
import ElFormItem from 'element-ui/lib/form-item';
import ElColorPicker from 'element-ui/lib/color-picker';
import ElDialog from 'element-ui/lib/dialog';

import Notification from 'element-ui/lib/notification';
import Loading from 'element-ui/lib/loading';
import MessageBox from 'element-ui/lib/message-box';

const components = {
    ElMenu, ElMenuItem, ElButton, ElButtonGroup, ElCheckbox, ElTabs, ElTabPane, ElTooltip,
    ElCol, ElContainer, ElAside, ElMain, ElHeader,
    ElInput, ElInputNumber, ElSelect, ElOption, ElTable, ElTableColumn,
    ElProgress, ElSlider, ElForm, ElFormItem,
    ElColorPicker, ElDialog,
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
