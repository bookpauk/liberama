<div class="part-header">Управление синхронизацией данных</div>

<div class="item row">
    <div class="label-1"></div>
    <q-checkbox class="col" v-model="serverSyncEnabled" size="xs" label="Включить синхронизацию с сервером" />
</div>

<div v-show="serverSyncEnabled">
    <!---------------------------------------------->
    <div class="part-header">Профили устройств</div>

    <div class="item row">
        <div class="label-1"></div>
        <div class="text col">
            Выберите или добавьте профиль устройства, чтобы начать синхронизацию настроек с сервером.
            <br>При выборе "Нет" синхронизация настроек (но не книг) отключается.
        </div>
    </div>
     <div class="item row">
        <div class="label-1">Устройство</div>
        <div class="col">
            <q-select v-model="currentProfile" :options="currentProfileOptions"
                style="width: 275px"
                dropdown-icon="la la-angle-down la-sm"
                outlined dense emit-value map-options
            />
        </div>
    </div>
    <div class="item row">
        <div class="label-1"></div>
        <q-btn class="button" dense no-caps @click="addProfile">Добавить</q-btn>
        <q-btn class="button" dense no-caps @click="delProfile">Удалить</q-btn>
        <q-btn class="button" dense no-caps @click="delAllProfiles">Удалить все</q-btn>
    </div>

    <!---------------------------------------------->
    <div class="part-header">Ключ доступа</div>
    
    <div class="item row">
        <div class="label-1"></div>
        <div class="text col">
            Ключ доступа позволяет восстановить профили с настройками и список читаемых книг.
            Для этого необходимо передать ключ на новое устройство через почту, мессенджер или другим способом.
        </div>
    </div>

    <div class="item row">
        <div class="label-1"></div>
        <q-btn class="button" style="width: 250px" dense no-caps @click="showServerStorageKey">
                <span v-show="serverStorageKeyVisible">Скрыть</span>
                <span v-show="!serverStorageKeyVisible">Показать</span>
                &nbsp;ключ доступа
         </q-btn>
    </div>

    <div class="item row">
        <div class="label-1"></div>
        <div v-if="!serverStorageKeyVisible" class="col">
            <hr/>
            <b>{{ partialStorageKey }}</b> (часть вашего ключа)
            <hr/>
        </div>
        <div v-else class="col" style="line-height: 100%">
            <hr/>
            <div style="width: 300px; padding-top: 5px; overflow-wrap: break-word;">
                <b>{{ serverStorageKey }}</b>
                <q-icon class="copy-icon" name="la la-copy" @click="copyToClip(serverStorageKey, 'Ключ')">
                    <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                </q-icon>            
            </div>
            <div v-if="mode == 'omnireader'">
                <br>Переход по ссылке позволит автоматически ввести ключ доступа:
                <br><div class="text-center" style="margin-top: 5px">
                    <a :href="setStorageKeyLink" target="_blank">Ссылка для ввода ключа</a>
                    <q-icon class="copy-icon" name="la la-copy" @click="copyToClip(setStorageKeyLink, 'Ссылка')">
                        <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                    </q-icon>            
                </div>
            </div>
            <hr/>
        </div>
    </div>

    <div class="item row">
        <div class="label-1"></div>
        <q-btn class="button" style="width: 250px" dense no-caps @click="enterServerStorageKey">Ввести ключ доступа</q-btn>
    </div>
    <div class="item row">
        <div class="label-1"></div>
        <q-btn class="button" style="width: 250px" dense no-caps @click="generateServerStorageKey">Сгенерировать новый ключ</q-btn>
    </div>
    <div class="item row">
        <div class="label-1"></div>
        <div class="text col">
            Рекомендуется сохранить ключ в надежном месте, чтобы всегда иметь возможность восстановить настройки,
            например, после переустановки ОС или чистки/смены браузера.<br>
            <b>ПРЕДУПРЕЖДЕНИЕ!</b> При утере ключа, НИКТО не сможет восстановить ваши данные, т.к. они сжимаются
            и шифруются ключом доступа перед отправкой на сервер.
        </div>
    </div>
</div>
