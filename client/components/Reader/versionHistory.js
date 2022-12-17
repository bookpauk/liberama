export const versionHistory = [
{
    version: '1.0.0',
    releaseDate: '2022-12-18',
    showUntil: '2022-12-25',
    content:
`
<ul>
    <li>на мобильных устройствах переход в полноэкранный режим теперь возможен через двойной тап по центру</li>
    <li>добавлено окно "Сетевая библиотека" для omnireader.ru</li>
    <li>улучшение работы синхронизации с сервером при плохом качестве связи</li>
    <li>добавлена сборка релизов читалки: <a href="https://github.com/bookpauk/liberama/releases" target="_blank">https://github.com/bookpauk/liberama/releases</a></li>
</ul>

`
},

{
    version: '0.12.2',
    releaseDate: '2022-09-04',
    showUntil: '2022-09-11',
    content:
`
<ul>
    <li>исправлен баг с формой для доната, показывалась каждый день, а не каждый месяц</li>
    <li>автор приносит извинения за доставленные неудобства</li>
</ul>

`
},

{
    version: '0.12.1',
    releaseDate: '2022-09-01',
    showUntil: '2022-08-30',
    content:
`
<ul>
    <li>добавлена форма для доната</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.12.0',
    releaseDate: '2022-07-27',
    showUntil: '2022-08-03',
    content:
`
<ul>
    <li>запущен сервер проверки обновлений книг:</li>
        <ul>
            <li>проверка обновления той или иной книги настраивается в списке загруженных (чекбокс)</li>
            <li>для того, чтобы чекбокс появился у ранее загруженной, необходимо принудительно обновить книгу</li>
            <li>в настройках можно указать разницу размеров, при которой требуется делать уведомление</li>
        </ul>
</ul>

`
},

{
    version: '0.11.8',
    releaseDate: '2022-07-14',
    showUntil: '2022-07-13',
    content:
`
<ul>
    <li>добавлено отображение и синхронизация обложек в окне загруженных книг</li>
    <li>добавлена синхронизация обоев</li>
</ul>

`
},

{
    version: '0.11.7',
    releaseDate: '2022-07-12',
    showUntil: '2022-07-19',
    content:
`
<ul>
    <li>добавлено автосокрытие панели управления при листании, отключается в настройках</li>
    <li>изменения в окне загруженных книг:</li>
        <ul>
            <li>добавлена группировка по версиям файла одной и той же книги</li>
            <li>группировка происходит по имени загружаемого файла, либо по URL книги</li>
            <li>добавлены различные методы сортировки списка загруженных книг</li>
            <li>нумерация всегда осуществляется по времени загрузки</li>
        </ul>
    <li>незначительные общие изменения интерфейса, приведение к единому стилю</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.11.6',
    releaseDate: '2022-07-02',
    showUntil: '2022-07-01',
    content:
`
<ul>
    <li>улучшено копирование текста прямо со страницы, для переводчиков</li>
    <li>актуализация используемых пакетов</li>
</ul>

`
},

{
    version: '0.11.5',
    releaseDate: '2022-04-15',
    showUntil: '2022-04-14',
    content:
`
<ul>
    <li>небольшие дополнения интерфейса</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.11.1',
    releaseDate: '2021-12-03',
    showUntil: '2021-12-02',
    content:
`
<ul>
    <li>переход на JembaDb вместо SQLite</li>
</ul>

`
},

{
    version: '0.11.0',
    releaseDate: '2021-11-18',
    showUntil: '2021-11-17',
    content:
`
<ul>
    <li>переход на Vue 3</li>
</ul>

`
},

{
    version: '0.10.3',
    releaseDate: '2021-10-24',
    showUntil: '2021-10-23',
    content:
`
<ul>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.10.2',
    releaseDate: '2021-10-19',
    showUntil: '2021-10-18',
    content:
`
<ul>
    <li>актуализация версий пакетов и стека используемых технологий</li>
</ul>

`
},

{
    version: '0.10.1',
    releaseDate: '2021-10-10',
    showUntil: '2021-10-09',
    content:
`
<ul>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.10.0',
    releaseDate: '2021-02-09',
    showUntil: '2021-02-16',
    content:
`
<ul>
    <li>добавлен двухстраничный режим</li>
    <li>в настройки добавлены все кириллические веб-шрифты от google</li>
    <li>в настройки добавлена возможность загрузки пользовательских обоев (пока без синхронизации)</li>
    <li>немного улучшен парсинг fb2</li>
</ul>

`
},

{
    version: '0.9.12',
    releaseDate: '2020-12-18',
    showUntil: '2020-12-17',
    content:
`
<ul>
    <li>добавлена вкладка "Изображения" в окно оглавления</li>
    <li>настройки конвертирования вынесены в отдельную вкладку</li>
    <li>добавлена кнопка для быстрого доступа к настройкам конвертирования</li>
    <li>улучшения работы конвертеров</li>
</ul>

`
},

{
    version: '0.9.11',
    releaseDate: '2020-12-09',
    showUntil: '2020-12-08',
    content:
`
<ul>
    <li>оптимизации, улучшения работы конвертеров</li>
</ul>

`
},

{
    version: '0.9.10',
    releaseDate: '2020-12-03',
    showUntil: '2020-12-10',
    content:
`
<ul>
    <li>добавлена частичная поддержка формата Djvu</li>
    <li>добавлена поддержка Rar-архивов</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.9.9',
    releaseDate: '2020-11-21',
    showUntil: '2020-11-20',
    content:
`
<ul>
    <li>оптимизации, исправления багов</li>
</ul>

`
},

{
    version: '0.9.8',
    releaseDate: '2020-11-13',
    showUntil: '2020-11-12',
    content:
`
<ul>
    <li>добавлено окно "Оглавление/закладки"</li>
</ul>

`
},

{
    version: '0.9.7',
    releaseDate: '2020-11-12',
    showUntil: '2020-11-11',
    content:
`
<ul>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.9.6',
    releaseDate: '2020-11-06',
    showUntil: '2020-11-05',
    content:
`
<ul>
    <li>завершена работа над новым окном "Библиотека"</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.9.5',
    releaseDate: '2020-11-01',
    showUntil: '2020-10-31',
    content:
`
<ul>
    <li>на панель инструментов добавлена новая кнопка "Обновить с разбиением на параграфы"</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.9.4',
    releaseDate: '2020-10-29',
    showUntil: '2020-10-28',
    content:
`
<ul>
    <li>заработал новый сайт <a href="https://liberama.top">https://liberama.top</a>, где будет более свободный обмен книгами</li>
    <li>для liberama.top добавлено новое окно: "Библиотека"</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.9.3',
    releaseDate: '2020-05-21',
    showUntil: '2020-05-20',
    content:
`
<ul>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.9.2',
    releaseDate: '2020-03-15',
    showUntil: '2020-04-25',
    content:
`
<ul>
    <li>в настройки добавлена возможность назначать сочетания клавиш на команды в читалке</li>
    <li>переход на Service Worker вместо AppCache для автономного режима работы</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.9.1',
    releaseDate: '2020-03-03',
    showUntil: '2020-03-02',
    content:
`
<ul>
    <li>улучшение работы серверной части</li>
    <li>незначительные изменения интерфейса</li>
</ul>

`
},

{
    version: '0.9.0',
    releaseDate: '2020-02-26',
    showUntil: '2020-02-25',
    content:
`
<ul>
    <li>переход на UI-фреймфорк Quasar</li>
    <li>незначительные изменения интерфейса</li>
</ul>

`
},

{
    version: '0.8.4',
    releaseDate: '2020-02-06',
    showUntil: '2020-02-05',
    content:
`
<ul>
    <li>добавлен paypal-адрес для пожертвований</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.8.3',
    releaseDate: '2020-01-28',
    showUntil: '2020-01-27',
    content:
`
<ul>
    <li>добавлено всплывающее окно с акцией "Оплатим хостинг вместе"</li>
    <li>внутренние оптимизации</li>
</ul>

`
},

{
    version: '0.8.2',
    releaseDate: '2020-01-20',
    showUntil: '2020-01-19',
    content:
`
<ul>
    <li>внутренние оптимизации</li>
</ul>

`
},

{
    version: '0.8.1',
    releaseDate: '2020-01-07',
    showUntil: '2020-01-06',
    content:
`
<ul>
    <li>добавлена частичная поддержка формата FB3</li>
    <li>исправлен баг "Request path contains unescaped characters"</li>
</ul>

`
},

{
    version: '0.8.0',
    releaseDate: '2020-01-02',
    showUntil: '2020-01-05',
    content:
`
<ul>
    <li>окончательный переход на https</li>
    <li>код проекта теперь Open Source: <a href="https://github.com/bookpauk/liberama" target="_blank">https://github.com/bookpauk/liberama</a></li>
</ul>

`
},

{
    version: '0.7.9',
    releaseDate: '2019-11-27',
    showUntil: '2019-11-26',
    content:
`
<ul>
    <li>добавлен неубираемый баннер для http-версии о переходе на httpS</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.7.8',
    releaseDate: '2019-11-25',
    showUntil: '2019-11-24',
    content:
`
<ul>
    <li>улучшение html-фильтров для сайтов</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.7.7',
    releaseDate: '2019-11-06',
    showUntil: '2019-11-10',
    content:
`
<ul>
    <li>добавлены следующие жесты для тачскрина (только при включенной опции "управление кликом"):</li>
    <ul>
        <li style="list-style-type: square">от центра вверх: на весь экран</li>
        <li style="list-style-type: square">от центра вниз: плавный скроллинг</li>
        <li style="list-style-type: square">от центра вправо: увеличить скорость скроллинга</li>
        <li style="list-style-type: square">от центра влево: уменьшить скорость скроллинга</li>
    </ul>
</ul>

`
},

{
    version: '0.7.6',
    releaseDate: '2019-10-30',
    showUntil: '2019-10-29',
    content:
`
<ul>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.7.5',
    releaseDate: '2019-10-22',
    showUntil: '2019-10-21',
    content:
`
<ul>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.7.3',
    releaseDate: '2019-10-18',
    showUntil: '2019-10-17',
    content:
`
<ul>
    <li>внутренние переделки механизма синхронизации с сервером</li>
    <li>добавлен html-фильтр для сайтов www.fanfiction.net, archiveofourown.org</li>
    <li>добавлен параметр "Включить html-фильтр для сайтов" в раздел "Вид"->"Текст" в настройках</li>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.7.1',
    releaseDate: '2019-09-20',
    showUntil: '2019-09-19',
    content:
`
<ul>
    <li>исправления багов</li>
    <li>на панель управления добавлена кнопка "Автономный режим"</li>
    <li>актуализирована справка</li>
</ul>

`
},

{
    version: '0.7.0',
    releaseDate: '2019-09-07',
    showUntil: '2019-10-01',
    content:
`
<ul>
    <li>налажена работа https-версии сайта, рекомендуется плавный переход</li>
    <li>добавлена возможность загрузки и работы https-версии читалки в оффлайн-режиме (при отсутствии интернета)</li>
    <li>упрощение механизма серверной синхронизации с целью повышения надежности и избавления от багов</li>
    <li>окна теперь можно перемещать за заголовок</li>
    <li>немного улучшен внешний вид и управление на смартфонах</li>
    <li>добавлен параметр "Компактность" в раздел "Вид"->"Текст" в настройках</li>
</ul>

`
},

{
    version: '0.6.10',
    releaseDate: '2019-07-21',
    showUntil: '2019-07-20',
    content:
`
<ul>
    <li>исправления багов</li>
</ul>

`
},

{
    version: '0.6.9',
    releaseDate: '2019-06-23',
    showUntil: '2019-06-22',
    content:
`
<ul>
    <li>исправлен баг - падение сервера при распаковке битых архивов книг</li>
    <li>исправлен баг - не распознавались некоторые книги формата fb2 в кодировке utf8</li>
    <li>добавлены новые варианты анимации перелистывания</li>
    <li>на страницу загрузки добавлен блок "Поделиться"</li>
    <li>улучшены прогрессбары</li>
    <li>исправления недочетов, небольшие оптимизации</li>
</ul>

`
},

{
    version: '0.6.7',
    releaseDate: '2019-05-30',
    showUntil: '2019-06-05',
    content:
`
<ul>
    <li>добавлен диалог "Что нового"</li>
    <li>в справку добавлена история версий проекта</li>
    <li>добавлена возможность настройки отображаемых кнопок на панели управления</li>
    <li>некоторые кнопки на панели управления были скрыты по умолчанию</li>
    <li>на страницу загрузки добавлена возможность загрузки книги из буфера обмена</li>
    <li>добавлен GET-параметр вида "/reader?__refresh=1&url=..." для принудительного обновления загружаемого текста</li>
    <li>добавлен GET-параметр вида "/reader?__pp=50.5&url=..." для указания позиции в книге в процентах</li>
    <li>исправления багов и недочетов</li>
</ul>

`
},

{
    version: '0.6.6',
    releaseDate: '2019-03-29',
    showUntil: '2019-03-29',
    content:
`
<ul>
    <li>в справку добавлено описание настройки браузеров для автономной работы читалки (без доступа к интернету)</li>
    <li>оптимизации процесса синхронизации, внутренние переделки</li>
</ul>

`
},

{
    version: '0.6.4',
    releaseDate: '2019-03-24',
    showUntil: '2019-03-24',
    content:
`
<ul>
    <li>исправления багов, оптимизации</li>
    <li>добавлена возможность синхронизации данных между устройствами</li>
</ul>

`
},

{
    version: '0.5.4',
    releaseDate: '2019-03-04',
    showUntil: '2019-03-04',
    content:
`
<ul>
    <li>добавлена поддержка форматов pdf, epub, mobi</li>
    <li>(0.5.2) добавлена поддержка форматов rtf, doc, docx</li>
    <li>(0.4.2) фильтр для СИ больше не вырезает изображения</li>
    <li>(0.4.0) добавлено отображение картинок в fb2</li>
</ul>

`
},

{
    version: '0.3.0',
    releaseDate: '2019-02-17',
    showUntil: '2019-02-17',
    content:
`
<ul>
    <li>поправки багов</li>
    <li>улучшено распознавание текста</li>
    <li>изменена верстка страницы - убрано позиционирование каждого слова</li>
</ul>

`
},

{
    version: '0.1.7',
    releaseDate: '2019-02-14',
    showUntil: '2019-02-14',
    content:
`
<ul>
    <li>увеличены верхние границы отступов и др.размеров</li>
    <li>добавлена настройка для удаления/вставки пустых параграфов</li>
    <li>добавлена настройка включения/отключения управления кликом</li>
    <li>добавлена возможность сброса настроек</li>
    <li>убран автоматический редирект на последнюю загруженную книгу, если не задан url в маршруте</li>
</ul>

`
},

{
    version: '0.1.0',
    releaseDate: '2019-02-12',
    showUntil: '2019-02-12',
    content:
`
<ul>
    <li>первый деплой проекта, длительность разработки - 2 месяца</li>
</ul>

`
},

]