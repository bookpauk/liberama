            <el-tab-pane label="Профили">
                <el-form :model="form" size="small" label-width="80px" @submit.native.prevent>
                    <div class="partHeader">Управление синхронизацией данных</div>
                    <el-form-item label="">
                        <el-checkbox v-model="serverSyncEnabled">Включить синхронизацию с сервером</el-checkbox>
                    </el-form-item>
                </el-form>

                <div v-show="serverSyncEnabled">
                <el-form :model="form" size="small" label-width="80px" @submit.native.prevent>
                    <div class="partHeader">Профили устройств</div>

                    <el-form-item label="">
                        <div class="text">
                            Выберите или добавьте профиль устройства, чтобы начать синхронизацию настроек с сервером.
                            <br>При выборе "Нет" синхронизация настроек (но не книг) отключается.
                        </div>
                    </el-form-item>

                    <el-form-item label="Устройство">
                        <el-select v-model="currentProfile" placeholder="">
                            <el-option label="Нет" value=""></el-option>
                            <el-option v-for="item in profilesArray"
                                :key="item"
                                :label="item"
                                :value="item">
                            </el-option>
                        </el-select>
                    </el-form-item>

                    <el-form-item label="">
                            <el-button @click="addProfile">Добавить</el-button>
                            <el-button @click="delProfile">Удалить</el-button>
                            <el-button @click="delAllProfiles">Удалить все</el-button>
                    </el-form-item>
                </el-form>

                <el-form :model="form" size="small" label-width="80px" @submit.native.prevent>
                    <div class="partHeader">Ключ доступа</div>

                    <el-form-item label="">
                        <div class="text">
                            Ключ доступа позволяет восстановить профили с настройками и список читаемых книг.
                            Для этого необходимо передать ключ на новое устройство через почту, мессенджер или другим способом.
                        </div>
                    </el-form-item>

                    <el-form-item label="">
                            <el-button style="width: 250px" @click="showServerStorageKey">
                                <span v-show="serverStorageKeyVisible">Скрыть</span>
                                <span v-show="!serverStorageKeyVisible">Показать</span>
                                ключ доступа
                         </el-button>
                    </el-form-item>

                    <el-form-item label="">
                        <div v-if="!serverStorageKeyVisible">
                            <hr/>
                            <b>{{ partialStorageKey }}</b> (часть вашего ключа)
                            <hr/>
                        </div>
                        <div v-else style="line-height: 100%">
                            <hr/>
                            <div style="width: 300px; padding-top: 5px; overflow-wrap: break-word;"><b>{{ serverStorageKey }}</b></div>
                            <br><div class="center">
                                <el-button size="mini" class="copy-button" @click="copyToClip(serverStorageKey, 'Ключ')">Скопировать ключ</el-button>
                            </div>
                            <div v-if="mode == 'omnireader'">
                                <br>Переход по ссылке позволит автоматически ввести ключ доступа:
                                <br><div class="center" style="margin-top: 5px">
                                    <a :href="setStorageKeyLink" target="_blank">Ссылка для ввода ключа</a>
                                </div>
                                <br><div class="center">
                                    <el-button size="mini" class="copy-button" @click="copyToClip(setStorageKeyLink, 'Ссылка')">Скопировать ссылку</el-button>
                                </div>
                            </div>
                            <hr/>
                        </div>
                    </el-form-item>

                    <el-form-item label="">
                            <el-button style="width: 250px" @click="enterServerStorageKey">Ввести ключ доступа</el-button>
                    </el-form-item>
                    <el-form-item label="">
                            <el-button style="width: 250px" @click="generateServerStorageKey">Сгенерировать новый ключ</el-button>
                    </el-form-item>

                    <el-form-item label="">
                        <div class="text">
                            Рекомендуется сохранить ключ в надежном месте, чтобы всегда иметь возможность восстановить настройки,
                            например, после переустановки ОС или чистки/смены браузера.<br>
                            <b>ПРЕДУПРЕЖДЕНИЕ!</b> При утере ключа, НИКТО не сможет восстановить ваши данные, т.к. они сжимаются
                            и шифруются ключом доступа перед отправкой на сервер.
                        </div>
                    </el-form-item>
                </el-form>
                </div>
            </el-tab-pane>
