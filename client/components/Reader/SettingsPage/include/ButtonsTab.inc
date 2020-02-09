            <el-tab-pane label="Кнопки">
                <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                    <div class="partHeader">Показывать кнопки панели</div>

                    <el-form-item label="" v-for="item in toolButtons" :key="item.name">
                        <el-checkbox @change="changeShowToolButton(item.name)" :value="showToolButton[item.name]">{{item.text}}</el-checkbox>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
