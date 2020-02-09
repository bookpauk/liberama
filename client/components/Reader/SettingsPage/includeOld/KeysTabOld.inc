            <el-tab-pane label="Управление">
                <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                    <div class="partHeader">Управление</div>

                    <el-form-item label="">
                        <el-checkbox v-model="clickControl">Включить управление кликом</el-checkbox>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
