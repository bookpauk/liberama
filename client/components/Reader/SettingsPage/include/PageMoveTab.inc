            <el-tab-pane label="Листание">
                <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                    <div class="partHeader">Анимация</div>

                    <el-form-item label="Тип">
                        <el-col :span="11">
                            <el-select v-model="pageChangeAnimation">
                                <el-option label="Нет" value=""></el-option>
                                <el-option label="Вверх-вниз" value="downShift"></el-option>
                                <el-option label="Вправо-влево" value="rightShift"></el-option>
                                <el-option label="Протаивание" value="thaw"></el-option>
                                <el-option label="Мерцание" value="blink"></el-option>
                                <el-option label="Вращение" value="rotate"></el-option>
                                <el-option v-show="wallpaper == ''" label="Листание" value="flip"></el-option>
                            </el-select>
                        </el-col>
                    </el-form-item>

                    <el-form-item label="Скорость">
                        <el-input-number v-model="pageChangeAnimationSpeed" :min="0" :max="100" :disabled="pageChangeAnimation == ''"></el-input-number>
                    </el-form-item>
                </el-form>

                <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                    <div class="partHeader">Другое</div>

                    <el-form-item label="Страница">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Переносить последнюю строку страницы<br>
                                в начало следующей при листании
                            </template>
                            <el-checkbox v-model="keepLastToFirst">Переносить последнюю строку</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                </el-form>
            </el-tab-pane>

