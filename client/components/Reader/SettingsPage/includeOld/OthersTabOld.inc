            <el-tab-pane label="Прочее">
                <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                    <div class="partHeader">Подсказки, уведомления</div>

                    <el-form-item label="Подсказка">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Показывать или нет подсказку при каждой загрузке книги
                            </template>
                            <el-checkbox v-model="showClickMapPage" :disabled="!clickControl">Показывать области управления кликом</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="Подсказка">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Мерцать сообщением в строке статуса и на кнопке<br>
                                обновления при загрузке книги из кэша
                            </template>
                            <el-checkbox v-model="blinkCachedLoad">Предупреждать о загрузке из кэша</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="Уведомление">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Показывать уведомления и ошибки от<br>
                                синхронизатора данных с сервером
                            </template>
                            <el-checkbox v-model="showServerStorageMessages">Показывать сообщения синхронизации</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="Уведомление">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Показывать уведомления "Что нового"<br>
                                при каждом выходе новой версии читалки
                            </template>
                            <el-checkbox v-model="showWhatsNewDialog">Показывать уведомление "Что нового"</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="Уведомление">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Показывать уведомление "Оплатим хостинг вместе"
                            </template>
                            <el-checkbox v-model="showDonationDialog2020">Показывать "Оплатим хостинг вместе"</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                </el-form>

                <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                    <div class="partHeader">Другое</div>

                    <el-form-item label="Парам. в URL">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Добавление параметра "__p" в строке браузера<br>
                                позволяет передавать ссылку на книгу в читалке<br>
                                без потери текущей позиции. Однако в этом случае<br>
                                при листании забивается история браузера, т.к. на<br>
                                каждое изменение позиции происходит смена URL.
                            </template>
                            <el-checkbox v-model="allowUrlParamBookPos">Добавлять параметр "__p"</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="Парсинг">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Включение этой опции позволяет делать предварительную<br>
                                обработку текста в ленивом режиме сразу после загрузки<br>
                                книги. Это может повысить отзывчивость читалки, но<br>
                                нагружает процессор каждый раз при открытии книги.
                            </template>
                            <el-checkbox v-model="lazyParseEnabled">Предварительная обработка текста</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="Копирование">
                        <el-tooltip :open-delay="500" effect="light">
                            <template slot="content">
                                Загружать весь текст в окно<br>
                                копирования текста со страницы
                            </template>
                            <el-checkbox v-model="copyFullText">Загружать весь текст</el-checkbox>
                        </el-tooltip>
                    </el-form-item>
                </el-form>
            </el-tab-pane>

