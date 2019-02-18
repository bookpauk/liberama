version = 'v3.1.8';

function splitRGB(color) //обработка цвета
{
	var matches = color.match(/^#?([\dabcdef]{2})([\dabcdef]{2})([\dabcdef]{2})$/i);
	if (!matches)
		return false;
	for (var i=1, rgb = new Array(3);  i<=3; i++)
		rgb[i-1] = parseInt(matches[i],16);
	return rgb;
}

function rgb2hex(r,g,b)
{
	if(r>255) r=255; //0_o быдлокодинг такой быдлокодинг
	if(g>255) g=255;
	if(b>255) b=255;
	return '#'+Number(r).toString(16).toUpperCase().replace(/^(.)$/,'0$1') +
		Number(g).toString(16).toUpperCase().replace(/^(.)$/,'0$1') +
		Number(b).toString(16).toUpperCase().replace(/^(.)$/,'0$1');
}

function base64color(arr) //цвет обрамления
{
	var r=arr[0];
	var g=arr[1];
	var b=arr[2];
	if(r>63) r=63; //0_o быдлокодинг такой быдлокодинг
	if(g>63) g=63;
	if(b>63) b=63;
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var enc1 = r >> 2;
	var enc2 = ((r & 3) << 4) | (g >> 4);
	var enc3 = ((g & 15) << 2) | (b >> 6);
	var enc4 = b & 63;
	return keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
}

function setColors() {
	var fc = splitRGB(cfg.fontcolor);
	var bg = splitRGB(cfg.bgcolor);
	var Q=[Math.round((fc[0]+3*bg[0])/16),Math.round((fc[1]+3*bg[1])/16),Math.round((fc[2]+3*bg[2])/16)];
	var M=[Math.round((fc[0]+bg[0])/8),Math.round((fc[1]+bg[1])/8),Math.round((fc[2]+bg[2])/8)];

	var middlecolor=rgb2hex(M[0]*4,M[1]*4,M[2]*4);

	colorMiddleB64=base64color(M);
	colorQuarterB64=base64color(Q);;
	if (fc[0]+fc[0]+fc[0]>bg[0]+bg[1]+bg[2]) {
		linkcolor=rgb2hex(Math.round(3*(fc[0]+bg[0])/4),Math.round(3*(fc[1]+bg[1])/4),Math.round(3*(fc[2]+bg[2])/4));
	} else {
		linkcolor=rgb2hex(Math.round((fc[0]+bg[0])/4),Math.round((fc[1]+bg[1])/4),Math.round((fc[2]+bg[2])/4));
	}

	document.body.link=document.body.vLink=
		document.body.aLink=
		gdb('comm').style.color=
		gdb('footer').style.color=linkcolor;

	document.body.style.color=gdb('book').style.color=gdb('main').style.color=
		gdb('pageGoto').style.color=
		gdb('cross').style.backgroundColor=
		gdb('mcross').style.backgroundColor=gdb('clrdiv').style.color=
		gdb('clrdiv2').style.color=
		gdb('btnOk').style.color=
		cfg.fontcolor;

	document.body.style.backgroundColor='#000000';

	gdb('win').style.backgroundColor=gdb('comm').style.backgroundColor=
		gdb('cross').style.color=
		gdb('mcross').style.color=
		gdb('clrdiv').style.backgroundColor=gdb('clrdiv2').style.backgroundColor=
		cfg.bgcolor;

	var hr=document.getElementsByTagName('HR');
	gdb('colorSelect').children[2].style.borderColor=gdb('colorSelect').children[2].children[1].style.borderColor=
		gdb('colorSelect').children[2].children[2].style.borderColor=hr[0].style.color=hr[0].style.backgroundColor=
		gdb('comm').style.borderColor=middlecolor;

	hr=null;

	//
	handlerAdd(gdb('cross'),'mouseover',function() {gdb('cross').style.color=middlecolor;});
	handlerAdd(gdb('cross'),'mouseout',function() {gdb('cross').style.color=cfg.bgcolor;});
	handlerAdd(gdb('mcross'),'mouseover',function() {gdb('mcross').style.color=middlecolor;});
	handlerAdd(gdb('mcross'),'mouseout',function() {gdb('mcross').style.color=cfg.bgcolor;});

}

function handlerAdd(object, event, handler) {
	if (object.addEventListener)
		object.addEventListener(event, handler, false);
	else
		if (object.attachEvent)
			object.attachEvent('on' + event, handler);
		else
			object['on' + event] = handler;
}

function handlerRemove(object, event, handler) {
	if (object.removeEventListener)
		object.removeEventListener(event, handler, false);
	else
		if (object.detachEvent)
			object.detachEvent('on' + event, handler);
}

//ниже: ловим клаву
function key(event) {
	if (!event) event = window.event;
	var thekey=event.keyCode ? event.keyCode + 32 : event.charCode;
	tM(event.shiftKey,event.ctrlKey,thekey, event);
}

var m_legend = {
	40: {30: 'PgUp', 100: 'PgDown'},
	60: {40: 'Up', 60: 'Menu', 100: 'Down'},
	100: {30: 'PgUp', 100: 'PgDown'}
};

function processClick(w, h) {
	var e = '';
	if (typeof(event) == 'string') {
		e = event;
	} else {
		loops: {
			for (var perx in m_legend) {
				for (var pery in m_legend[perx]) {
					if (w < perx && h < pery) {
						e = m_legend[perx][pery];
						break loops;
					}
				}
			}
		}
		if (e != '')
			button = 1;
	}

	switch (e) {
		case 'Down' ://Down
			setTop(null, cfg.step);
		break;
		case 'Up' ://Up
			setTop(null, -cfg.step);
		break;
		case 'PgDown' ://PgDown
			setTop(null, phei - cfg.step);
		break;
		case 'PgUp' ://PgUp
			setTop(null, -(phei - cfg.step));
		break;
		case 'Menu' ://M
			menu();
		break;
		default :
			// Nothing
		break;
	}
	if (doRepeatClick && e != '' && e != 'Menu') {
		if (mTimer > 20)
			mTimer = mTimer*0.5;
		processClickTimeout=setTimeout('processClick('+w+','+h+')', mTimer);
	}
}


function mClick(event) {
	if (cfg.by_click) {
		var win = gdb('win');
		var w = event.clientX/win.offsetWidth*100;
		var h = event.clientY/win.offsetHeight*100;

		doRepeatClick = 1;
		mTimer = 1000;
		processClick(w, h);
		ie8SafePreventEvent(event);
	}
}

function mClickUp(event) {
	mTouchEnd(event);
}

function mTouchStart(event) {
	if (cfg.by_click) {
		if (event.touches.length == 1) {
			event.preventDefault();
			e = event.touches[0];
			var win = gdb('win');
			var w = e.clientX/win.offsetWidth*100;
			var h = e.clientY/win.offsetHeight*100;

			doRepeatClick = 1;
			mTimer = 1000;
			processClick(w, h);
		}
	}
}

function mTouchEnd(event) {
	doRepeatClick = 0;
	if (processClickTimeout != null)
		clearTimeout(processClickTimeout);
}

function openLink(event, obj, target) {
	if (target == null)
		target = '_blank';
	window.open(obj.href, target);
	ie8SafePreventEvent(event);
	return false;
}

function toggleFullScreen() {
	if ((document.fullScreenElement && document.fullScreenElement !== null) ||
		 (!document.mozFullScreen && !document.webkitIsFullScreen)) {
		if (document.documentElement.requestFullScreen) {
			document.documentElement.requestFullScreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullScreen) {
			document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	} else {
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		}
	}
}

function ie8SafePreventEvent(e) {
	if (e.preventDefault) {
		e.preventDefault()
	} else
		if (e.stop)
			e.stop();

	e.returnValue = false;
	if (e.stopPropagation)
		e.stopPropagation();
}
//ниже: ловим нажатия клавиш
function tM(shift,ctrl,key, event) {
	var srcEl = event.srcElement? event.srcElement : event.target;
	//alert(srcEl.tagName);
	//alert(key);
	if (!ctrl && (srcEl.tagName == 'BODY' || srcEl.tagName == 'DIV'))
		switch (key)
		{
			case 72 ://Down
				if (shift)
					toggleScroll();
				else
					setTop(null, cfg.step);
				ie8SafePreventEvent(event);
			break;
			case 70 ://Up
				setTop(null, -cfg.step);
				ie8SafePreventEvent(event);
			break;
			case 66 ://PgDown
			case 45 ://Enter
				setTop(null, phei - cfg.step);
				ie8SafePreventEvent(event);
			break;
			case 64 ://Space
				shift ? setTop(null, -(phei - cfg.step)) : setTop(null, phei - cfg.step);
				ie8SafePreventEvent(event);
			break;
			case 65 ://PgUp
			case 40 ://BackSpace
				setTop(null, -(phei - cfg.step));
				ie8SafePreventEvent(event);
			break;
			case 67 ://End
				setTop(clih - phei);
				ie8SafePreventEvent(event);
			break;
			case 68 ://Home
				setTop(0);
				ie8SafePreventEvent(event);
			break;
			case 109: //M
				menu();
				ie8SafePreventEvent(event);
			break;
			case 97: //A
				shift ? incFont(-1) : incFont(1);
				ie8SafePreventEvent(event);
			break;
			case 115: //S
				gdb('id_scroll').checked = !gdb('id_scroll').checked;
				showScroll();
				ie8SafePreventEvent(event);
			break;
			case 116: //T
				gdb('id_by_click').checked = !gdb('id_by_click').checked;
				byClick();
				ie8SafePreventEvent(event);
			break;
			case 224://`
			case 102://F
				toggleFullScreen();
				ie8SafePreventEvent(event);
			break;
			case 122://Z
				toggleScroll();
				ie8SafePreventEvent(event);
			break;
			case 59://Escape
				if (sti) {
					toggleScroll();
					ie8SafePreventEvent(event);
				}
			break;
			case 71://Right
				if (shift) {
					gdb('id_sc_int').value = cfg.sc_int - 1;
					scrollInterval();
				} else {
					setTop(null, phei - cfg.step);
					ie8SafePreventEvent(event);
				}

			break;
			case 69://Left
				if (shift) {
					gdb('id_sc_int').value = cfg.sc_int + 1;
					scrollInterval();
				} else {
					setTop(null, -(phei - cfg.step));
					ie8SafePreventEvent(event);
				}
			break;
			case 114:
				reloadBook();
			break;
			default :
				// Nothing
			break;
		}
	return false;
}

//колесо
function wheel(event) {
	var delta = 0;
	if (!event)
		event = window.event;
	if (event.wheelDelta)
		delta = event.wheelDelta/120;
	else
		if (event.detail)
			delta = -event.detail/3;
	if (delta)
		handle(delta);
	return false;
}

function handle(delta) {
	if (delta < 0)
		setTop(null, cfg.step);
	else
		setTop(null, -cfg.step);
}

//ниже: упрошаемс, в финальной версии набо бы убрать
function gdb(id)
{
	return document.getElementById(id);
}

function supports_html5_storage() {
	try {
	return 'localStorage' in window && window['localStorage'] !== null;
} catch (e) {
	return false;
	}
}

function saveLocalValue(key, value, expires_days, no_escape) {
	if (value != null) {
		if (no_escape == null)
			localStorage[key] = escape(value);
		else
			localStorage[key] = value;
		if (expires_days == null)
			expires_days = 0;
		localStorage[key+'=timestamp'] = (new Date()) + ';' + expires_days;
	}
	else {
		localStorage.removeItem(key);
		localStorage.removeItem(key+'=timestamp');
	}
}

//кукисы и localStorage
function saveValue(name, value, expires_days, no_escape) {
	var key = escape(name);
	if (is_storage) {
		try {
			saveLocalValue(key, value, expires_days, no_escape);
		} catch (e) {
			//alert('LocalStorage, ошибка: ' + e.message);
			var size = 0;
			//С начала - хоть какой-то механизм очереди
			for ( var i = 0; i < localStorage.length; i++ ) {
				var lkey = localStorage.key( i );

				var v = localStorage[lkey];
				//lkeys = lkeys + unescape(lkey) + ":" + (v != null ? v.length : 0) + "\n";

				if (v != null && v.length > 10000) {
					size += v.length;
					localStorage.removeItem(lkey);
					localStorage.removeItem(lkey+'=timestamp');
					i = 0;
					if (size > value.length)
						break;
				}
			}
			//Чистка протухших, с конца
			for ( var i = localStorage.length; i >= 0 ; i-- ) {
				var lkey = unescape(localStorage.key( i ));
				loadValue(lkey);
			}

			try { saveLocalValue(key, value, expires_days, no_escape) } catch(e) {};
			//alert(size);
			//LocalStorage.clear();
		}
		if (document.cookie != '')
			document.cookie = '';
	} else {
		var exp = new Date();
		if (expires_days)
			exp.setHours(exp.getHours() + 24*expires_days);
		document.cookie = key + "=" + escape(value) +
			((expires_days) ? "; expires=" + exp.toUTCString() : "") +
			"; path=/";
	}
}

function getCookie(name) {
	var setStr = null;
	var cookie = " " + document.cookie;
	var search = " " + name + "=";
	var offset = 0;
	var end = 0;
	if (cookie.length > 0) {
		offset = cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			end = cookie.indexOf(";", offset)
			if (end == -1)
				end = cookie.length;
			setStr = unescape(cookie.substring(offset, end));
		}
	}
	return(setStr);
}

function loadValue(name, no_escape) {
	var value = null;
	if (is_storage) {
		var key = escape(name);
		value = localStorage[key];
		var ts = localStorage[key+'=timestamp'];
		if (value != null && no_escape == null)
			value = unescape(value);
		if (ts != null) {
			ts = ts.split(";");
			var exp = new Date(ts[0]);
			exp.setHours(exp.getHours() + 24*ts[1]);
			if (exp < new Date()) {
				value = null;
				localStorage.removeItem(key);
				localStorage.removeItem(key+'=timestamp');
			}
		} else {
			localStorage.removeItem(key);
			localStorage.removeItem(key+'=timestamp');
		}
	}
	if (value == null)
		value = getCookie(escape(name));
	if (value == null)
		value = getCookie(name);
	return(value);
}

//счётчик страниц и процентов
function tMh() {
	if (!sti || gdb('main').scrollTop%cfg.step == 0) {
		var top = Math.round(gdb('main').scrollTop/cfg.step)*cfg.step;
		gdb('main').scrollTop = top;

		pcount = Math.ceil( clih / (phei-cfg.step) );
		if (clih == phei)
			pcount = 1;
		var page = Math.floor((top - cfg.step) / (phei-cfg.step) + 2);
		percent = Math.round(top / (clih-phei) * 10000) / 100;	 //(top==0) ? 0 :
		if (clih == phei)
			percent = 100;
		gdb('pagePercent').innerHTML='&nbsp;&nbsp;[ ' + percent.toFixed(2) + '%' + ' ]&nbsp;&nbsp;&nbsp;';
		gdb('pageCount').children[1].innerHTML=page + '/' + pcount;
		gdb('pageGoto').value=page;

		if (stadc == null)
			stadc = setTimeout('addCook()', 300);
	};
	if (sttmh != null) {
		clearTimeout(sttmh);
		sttmh = null;
	}
}

//переход на страницу
function goTo() {
	var gpage=parseInt(gdb('pageGoto').value);
	setTop((((gpage-2)*(phei-cfg.step) + cfg.step)/cfg.step).toFixed(0)*cfg.step);
}

function pageGoto(gpag) {
	if (gpa) {
		var gpage=parseInt(gdb('pageGoto').value);
		gpage = gpag ? (gpage > 1 ? gpage-1 : 1) : (gpage<pcount ? gpage+1 : pcount);
		gdb('pageGoto').value=gpage;

		var t=setTimeout('pageGoto('+gpag+')',timer);
		if (timer>20)
			timer=timer/2;
	} else
		timer=300;
}

function pageMove(arrow) {
	handlerAdd(document,'mouseup',pageMoveClear);
	if (timer>20) timer=timer*0.9;
	setTop(null, (arrow ? cfg.step-phei : phei-cfg.step));
	pageMoveTimeout=setTimeout('pageMove('+arrow+')',timer);
}

function pageMoveShow(pS,nS) {
	pageMoveTemp = pageMoveTemp ? 0 : 1;
	gdb('pageCount').children[0].style.visibility=
		gdb('pageCount').children[2].style.visibility=
		pageMoveTemp ? 'visible' : 'hidden';
}

function pageMoveClear() {
	if (timer<300) {
		clearTimeout(pageMoveTimeout);
		handlerRemove(document,'mouseup',pageMoveClear);
		timer=300;
	}
}

//время
function showTime()
{
	var tmN=new Date();
	var dH=''+tmN.getHours();dH=dH.length<2?'0'+dH:dH;
	var dM=''+tmN.getMinutes();dM=dM.length<2?'0'+dM:dM;
	var tmp=dH+':'+dM;
	if (bookloaded)
		gdb('tm').innerHTML=tmp;
	else
		gdb('tm').innerHTML=version;
	var t=setTimeout('showTime()',60000);
}

function setSelectedFontItem() {
	if (colorFontTemp == 0) {
		gdb('fontItemBack').style.color = 'green';
		gdb('fontItemBack').style.textDecoration = 'underline';
		gdb('fontItemText').style.color = 'black';
		gdb('fontItemText').style.textDecoration = 'none';
	} else {
		gdb('fontItemText').style.color = 'green';
		gdb('fontItemText').style.textDecoration = 'underline';
		gdb('fontItemBack').style.color = 'black';
		gdb('fontItemBack').style.textDecoration = 'none';
	}
}

//меню выбора настроек шрифта
function colorMenu() {
	handlerAdd(document,'mousemove', mouseMoved);
	colorFontTemp=0;
	setSelectedFontItem();
	colorFont=cfg.fontcolor;
	colorBg=cfg.bgcolor;
	colorSize=Math.round(cfg.step*0.8);
	gdb('fcolor').value=colorFont;
	gdb('bcolor').value=colorBg;
	gdb('fsize').value=colorSize;
	gdb('ffamily').value=cfg.fontfamily;
	if (gdb('ffamily').value != cfg.fontfamily)
		gdb('ffamily2').value=cfg.fontfamily;
	else
		gdb('ffamily2').value='';

	colorAddary=new Array(255,1,1);
	colorClrary=new Array(360);
	for(i=0;i<6;i++) {
		for(j=0;j<60;j++) {
			colorClrary[60*i+j]=new Array(3);
			for(k=0;k<3;k++) {
				colorClrary[60*i+j][k]=colorAddary[k];
				colorAddary[k]+=((Math.floor(65049010/Math.pow(3,i*3+k))%3)-1)*4;
			}
		}
	}
	gdb('colorSelect').style.display='block';
}

function mouseMoved(e) {
	var sy = e.pageX-parseInt(gdb('colorSelect').style.left)-454;
	var sx = e.pageY-parseInt(gdb('colorSelect').style.top)-300;
	//alert(sy+'lk'+sx);
	if (sy>-256&&sx>-256&&sx<256&&sy<256)	{
		var quad=new Array(-180,360,180,0);
		var xa=Math.abs(sx);
		var ya=Math.abs(sy);
		var d=ya*45/xa;
		if (ya>xa)
			d=90-(xa*45/ya);
		var deg=Math.floor(Math.abs(quad[2*((sy<0)?0:1)+((sx<0)?0:1)]-d));
		var n=0;
		var c="000000";
		var r=Math.sqrt((xa*xa)+(ya*ya));
		if(sx!=0 || sy!=0) {
			for(i=0;i<3;i++) {
				r2=colorClrary[deg][i]*r/128;
				if (r>128)
					r2+=Math.floor(r-128)*2;
				if (r2>255)
					r2=255;
				n=256*n+Math.floor(r2);
			}
			c=(n.toString(16)).toUpperCase();
			while (c.length<6)
				c="0"+c;
		}
		gdb('clrdiv').style.backgroundColor=colorFontTemp ? colorBg : "#"+c;
		gdb('clrdiv').style.color=colorFontTemp ? "#"+c : colorFont;
		tempColor="#"+c;
	}
	return false;
}

function colorSet() {
	var clrdiv2=gdb('clrdiv2').style;
	if (colorFontTemp)
		clrdiv2.color=gdb('fcolor').value=colorFont=tempColor;
	else
		clrdiv2.backgroundColor=gdb('bcolor').value=colorBg=tempColor;
}

function colorChange(type, value) { //навести марафет
	var value=value.toUpperCase();
	if(type==2 || type==1) {
		if (value.charAt(0)!='#')
			value='#'+value;
		value=value.length==7 ? value :
			(value.length==4 ?
				value.substr(0,2)+value.substr(1,1)+value.substr(2,1)+value.substr(2,1)+value.substr(3,1)+value.substr(3,1) :
				(type==2 ? cfg.bgcolor : cfg.fontcolor)
			); //сделать человечески
		if (type==2)
			gdb('bcolor').value = value;
		else
			gdb('fcolor').value = value;
	}

	var clrdiv2=gdb('clrdiv2').style;
	var clrdiv=gdb('clrdiv').style;
	if (type == 4)
		clrdiv2.fontFamily = value;
	if (type==3 && parseInt(value) > 4 && parseInt(value) < 201)
		clrdiv2.fontSize=clrdiv.fontSize=parseInt(value)+'px';
	if (type==2)
		clrdiv2.backgroundColor=clrdiv.backgroundColor=value;
	if (type==1)
		clrdiv2.color=clrdiv.color=value;
	return false;
}

function saveSettings() {
	saveValue('colorSetting', cfg.fontcolor+'|'+cfg.bgcolor+'|'+cfg.step+'|'+cfg.fontfamily+'|'+cfg.scroller+'|'+cfg.sp_size+'|'+cfg.sc_int+'|'+cfg.by_click, 36500);
}

function colorSubmit() {
	cfg.fontcolor=gdb('fcolor').value;
	cfg.bgcolor=gdb('bcolor').value;
	cfg.step=Math.round(parseInt(gdb('fsize').value)/0.8);
	cfg.fontfamily=gdb('ffamily2').value;
	if (!cfg.fontfamily)
		cfg.fontfamily = gdb('ffamily').value;
	gdb('main').style.font=Math.round(cfg.step*0.8)+"px/"+cfg.step+"px Trebuchet Ms";
	gdb('main').style.fontFamily=cfg.fontfamily;
	saveSettings();
	setColors();
	onRes();
}

function colorClose() {
	handlerRemove(document,'mousemove', mouseMoved);
	gdb('colorSelect').style.display='none';
	tempColor=null;
	colorFontTemp=null;
	colorFont=null;
	colorBg=null;
	colorSize=null;
	colorAddary=null;
	colorClrary=null;
}

function incFont(i) {
	foSize=Math.round(cfg.step*0.8);
	foSize += i;
	if (foSize < 5 || foSize > 200)
		return;
	cfg.step=Math.round(foSize/0.8);
	gdb('main').style.fontSize = foSize + 'px';
	gdb('main').style.lineHeight = cfg.step + 'px';
	saveSettings();
	onRes();
}

function mainScroll() {
	if (sttmh == null)
		sttmh = setTimeout('tMh()', 500);
}

//ниже: в кукисы
function addCook() {
	saveValue('bpr-book-' + tit, gdb('main').scrollTop + '|' + gdb('main').scrollHeight + '|' + gdb('main').innerHTML.length, 36500);
	if (stadc) {
		clearTimeout(stadc);
		stadc = null;
	}
}

//ниже: меню
function menu() {
	if (gdb('comm').style.display != 'block')
		gdb('comm').style.display="block";
	else {
		gdb('leg').style.display="none";
		gdb('comm').style.display="none";
	}
}

//ниже: легенда
function legend(ca) {
	if (ca) {
		gdb('leg').style.display="block";
		gdb('leg').style.left=Math.round((widt-((widt/100)*60))/2) + 'px';
		gdb('leg').style.top=Math.round((hei-((hei/100)*60))/2) + 'px';
	} else {
		gdb('leg').style.display="none";
	}
}

function setScroll(u) {
	u = (u == null) ? true : u;

	gdb('id_scroll').checked = cfg.scroller;
	if (cfg.scroller)
		gdb('main').style.overflowY = 'auto';
	else
		gdb('main').style.overflowY = 'hidden';
	if (u)
		onRes();
}

function showScroll() {
	cfg.scroller = gdb('id_scroll').checked;
	setScroll();
	saveSettings();
	return true;
}

function setSPSize(u) {
	u = (u == null) ? true : u;

	gdb('id_sp_size').value = cfg.sp_size;

	gdb('footer').style.height = cfg.sp_size + 'px';
	gdb('fhr').style.bottom = cfg.sp_size + 'px';
	if (cfg.sp_size == 0)
		gdb('fhr').style.display = 'none';
	else
		gdb('fhr').style.display = 'block';

	if (cfg.sp_size > 2)
		gdb('footer').style.font=(cfg.sp_size - 3)+"px/"+(cfg.sp_size-1)+"px 'Trebuchet Ms', Sans-Serif";

	if (u)
		onRes();
}

function statusPanel() {
	var s = parseInt(gdb('id_sp_size').value);
	if (s >= 0 && s <= 200)
		cfg.sp_size = s;
	setSPSize();
	saveSettings();
	return false;
}

function setTop(v, i) {
	if (i != null)
		gdb('main').scrollTop += i;
	else
		gdb('main').scrollTop = v;
	tMh();
	p_top = gdb('main').scrollTop;
}

function scrollText() {
	setTop(null, 1);
}

function toggleScroll(u) {
	u = (u == null) ? true : u;

	//alert('ok');
	if (sti) {
		clearTimeout(sti);
		sti = null;
		if (u)
			tMh();
	} else
		sti = setInterval('scrollText()', cfg.sc_int);
	return false;
}

function setScrollInt(u) {
	u = (u == null) ? true : u;

	gdb('id_sc_int').value = cfg.sc_int;
	toggleScroll(u);
	toggleScroll(u);
}

function scrollInterval() {
	var s = parseInt(gdb('id_sc_int').value);
	if (s > 0 && s <= 999)
		cfg.sc_int = s;
	setScrollInt(false);
	saveSettings();
	return false;
}

function setByClick() {
	gdb('id_by_click').checked = cfg.by_click;
}

function byClick() {
	cfg.by_click = gdb('id_by_click').checked;
	setByClick();
	saveSettings();
	return true;
}

function reloadBook() {
	if (is_storage) {
		saveValue('bpr-link-' + tit, null);
		saveValue('bpr-cached-book-'+tit, null);
	}
	window.location.href = window.location.href;
	return false;
}

function blinkReloadButton() {
	blinkCount++;
	if (blinkCount%2 == 1)
		gdb('reload').style.color = cfg.bgcolor;
	else
		gdb('reload').style.color = linkcolor;
	if (blinkCount > 30) {
		gdb('reload').style.color = linkcolor;
		if (stblinkRB != null) {
			clearTimeout(stblinkRB);
			stblinkRB == null;
		}
	}
}

//ниже: ловим изменение размеров окна
//ниже: ловим размеры рабочей области
function gerT() {
	var w, h, hh;
	w = Math.round(window.innerWidth ?
		window.innerWidth :
		(document.documentElement.clientWidth ? document.documentElement.clientWidth : document.body.offsetWidth));
	h = Math.round(window.innerHeight ?
		window.innerHeight :
		(document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.offsetHeight));
	hh = Math.floor((h - (cfg.sp_size + 8)) / cfg.step) * cfg.step;
	return {w:w, h:h, hh:hh};
}

function onRes(u) {
	var focused = document.activeElement;
	//alert(focused.tagName);
	if (focused == null || focused.tagName != 'INPUT') {
		var g = gerT();
		hei = g.h;
		phei = g.hh;
		widt = g.w;

		gdb('header').style.height = Math.round((hei - (cfg.sp_size + 3) - phei)/2)+'px';
		gdb('main').style.height=phei+'px';
		gdb('win').style.height=hei+'px';

		//alert(widt + '/' +gdb('tr').style.width +gdb('main').style.width+gdb('tr').style.width)
		clih = gdb('main').scrollHeight;

		gdb('colorSelect').style.top=Math.round((hei-600)/2)+'px';
		gdb('colorSelect').style.left=Math.round((widt-300)/2)+'px'; //754
		gdb('comm').style.left=Math.round((widt-264)/2) + 'px';
		gdb('comm').style.top=Math.round((hei-264)/2) + 'px';
		if (u || u == null) {
			if (pclih != clih && pclih > 0) {
				var n_top = Math.round(p_top/pclih*clih);
				setTop(n_top);
			} else
				tMh();
			pclih = clih;
		}

		ow = widt - (gdb('id_lp').clientWidth + gdb('id_rp').clientWidth) - 10;
		if (ow < 0)
			ow = 0;
		gdb('orig').style.width = ow + 'px';
		gdb('orig').style.left = gdb('id_lp').clientWidth + 'px';
	} else
		setTimeout('onRes()', 500);
}

//--------------------------------------------------------------------------------------------------
//загрузка
function loadBook(book) {

	gdb('main').innerHTML = book;

	//ниже: добываем тайтл
	var book_author = loadValue('bpr-author-' + tit);
	book_author = (book_author == null ? '' : book_author);
	var book_title = loadValue('bpr-title-' + tit);
	book_title = (book_title == null ? '' : book_title);
	var doc_title = tit;
	if (book_author + book_title != '')
		 doc_title = book_author + (book_author != '' ? ' - ' : '') + book_title;

	if (tit != '')
		document.title = doc_title;

	bookloaded = true;
	gdb('win').style.display = gdb('footer').style.display = 'block';
	onRes(false);
	setTimeout('handlerAdd(window,"resize",onRes)',1); //ещё одно чудо от осла !!проверить
	gdb('orig_href').href = tit;
	gdb('orig_href').innerHTML = doc_title;
	showTime();

	pclih = gdb('main').scrollHeight;
	var s_top = 0;
	var lv = loadValue('bpr-book-' + tit);
	if (lv) {
		// Восстановим позицию в тексте
		var cpos = lv.split('|');
		var ntl = gdb('main').innerHTML.length;
		if (cpos[0]) {
			if (cpos[1] > 0 && ntl > 0) {
				var tp = cpos[0]/cpos[1]*cpos[2];
				s_top = Math.round(tp/ntl*pclih);
			}
			else
				s_top = cpos[0]; // Старый вариант
		}
	}
	setTop(s_top);
	onRes(false);

	gdb('loading').style.display='none';
}

function parseBook(book, cached, save_to_cache) {
	var meta_sign = '<<<bpr5A432688AB0467AA396E5A144830248Abpr>>>';
	var meta_idx = book.indexOf(meta_sign);
	if (meta_idx >= 0) {
		var meta_info = book.substr(0, meta_idx).split('|');
		var book_link = meta_info[0];
		var book_author = meta_info[1];
		var book_title =  meta_info[2];
		if (book_link != null) {
			book = book.substr(meta_idx + meta_sign.length);
			if (is_storage) {
				if (book_link != 'no_file') {
					saveValue('bpr-link-' + tit, book_link, 10);
				}
				if (save_to_cache) {
					saveValue('bpr-cached-book-'+tit, book, 30, 1);
				}

				saveValue('bpr-author-' + tit, book_author, 10);
				saveValue('bpr-title-' + tit, book_title, 10);
			}
		}
	}
	loadBook(book);
	if (cached != null) {
		blinkCount = 0;
		stblinkRB = setInterval('blinkReloadButton()', 500);
	}
}

function getDefaultSettings() {
	var def = {};
	def.bgcolor='#ebe2c9';
	def.fontcolor='#000000';
	def.step = 26;
	def.fontfamily = 'Trebuchet Ms';
	def.scroller = true;
	def.sp_size = 22;
	def.sc_int = 50;
	def.by_click = true;

	return def;
}

function loadSettings() {
	if (location.hash == '#RestoreDefaults') {
		saveSettings();
	} else {
		var lv = loadValue('colorSetting');
		if (lv) {
			var colorSetting=lv.split('|');
			cfg.fontcolor=colorSetting[0];
			cfg.bgcolor=colorSetting[1];
			cfg.step=parseInt(colorSetting[2]);
			if (colorSetting[3])
				cfg.fontfamily=colorSetting[3];
			if (colorSetting[4] != null)
				cfg.scroller = colorSetting[4].toLowerCase() == 'true';
			if (colorSetting[5] != null)
				cfg.sp_size = parseInt(colorSetting[5]);
			if (colorSetting[6] != null)
				cfg.sc_int = parseInt(colorSetting[6]);
			if (colorSetting[7] != null)
				cfg.by_click = colorSetting[7].toLowerCase() == 'true';
		}
	}
}

function applySettings() {
	setScroll(false);
	setSPSize(false);
	setScrollInt(false);
	setByClick();

	gdb('main').style.font=Math.round(cfg.step*0.8)+"px/"+cfg.step+"px "+cfg.fontfamily;
	gdb('clrdiv2').style.fontSize=Math.round(cfg.step*0.8)+'px';

	setColors();
}

function parseQuery(qry) {
	var params = {};
	var a = qry.split('&');
	for (var i = 0; i < a.length; i++) {
		var b = a[i].split('=');
		params[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
	}
	return params;
}

function objectEquals(obj1, obj2) {
    for (var i in obj1) {
        if (obj1.hasOwnProperty(i)) {
            if (!obj2.hasOwnProperty(i)) return false;
            if (obj1[i] != obj2[i]) return false;
        }
    }
    for (var i in obj2) {
        if (obj2.hasOwnProperty(i)) {
            if (!obj1.hasOwnProperty(i)) return false;
            if (obj1[i] != obj2[i]) return false;
        }
    }
    return true;
}

function checkRedirect() {
	if (typeof doRedirect == 'string' && doRedirect != '') {
		var settings = JSON.stringify(cfg);
		window.location.href = doRedirect + '?sets=' + btoa(settings) + '&' + window.location.search.substr(1);
		return true;
	}

	var qry = location.search.substr(1);
	var params = parseQuery(qry);
	if ('sets' in params) {
		var settings = atob(params.sets);
		var newCfg = JSON.parse(settings);
		if (objectEquals(cfg, getDefaultSettings())) {
			cfg = newCfg;
			saveSettings();
			applySettings();
		}

		var qry = location.search.substr(1);
		var url = qry.split('url=')[1] || '';
		if (url != '')
			window.location.href = siteroot + '?url=' + url;
		else
			window.location.href = siteroot;
		return true;
	}

	return false;
}

function onLoa() {
	DOM = document.getElementById;
	Netscape4 = document.layer;
	Netscape6 = Mozilla = (navigator.appName == "Netscape") && DOM;
	Netscape7 = navigator.userAgent.indexOf("Netscape/7") >= 0;
	Opera5 = window.opera && DOM;
	Opera6 = Opera5 && window.print;
	Opera7 = Opera5 && navigator.userAgent.indexOf("Opera 7") >= 0;
	Opera8 = navigator.userAgent.indexOf("Opera/8") >= 0;
	Opera9 = navigator.userAgent.indexOf("Opera/9") >= 0;
	IE = document.all && !Opera5;
	Firefox = navigator.userAgent.indexOf("Firefox") >= 0;

	is_storage = supports_html5_storage();

	bookloaded = false;

	handlerAdd(document,'keydown', key); //ловим нажатие кнопки

	if (window.addEventListener)
		window.addEventListener('DOMMouseScroll', wheel, false);
	window.onmousewheel = document.onmousewheel = wheel;

	sti = null;
	sttmh = null;
	stadc = null;

	blinkCount = 0;
	stblinkRB = null;

	gdb('main').onscroll = mainScroll;
	pageMoveTemp=0; //индикатор скрытости стрелочек

	cfg = getDefaultSettings();
	loadSettings();
	applySettings();

	link = '';
	flink = '';
	percent = 0.00;
	gpa = 1;
	timer=300;

	doRepeatClick = 0;
	processClickTimeout = null;

	pcount = 1;
	clih = 0;
	pclih = 0;
	p_top = 0;

	tit='';

	if (checkRedirect())
		return;

	try {
		var qry = location.search.substr(1);
		var url = qry.split('url=')[1] || '';
		var furl = siteroot + 'f.php?url=' + url;
		gdb('loading').style.display='block';

		if (url.length > 0) {
			if ('ontouchstart' in document.documentElement) {
				 handlerAdd(gdb('win'),'touchstart', mTouchStart); //ловим тачпад
				 handlerAdd(gdb('win'),'touchend', mTouchEnd); //ловим тачпад
			} else {
				handlerAdd(gdb('win'),'mousedown', mClick); //ловим нажатие мыши
				handlerAdd(gdb('win'),'mouseup', mClickUp); //ловим нажатие мыши
			}
		}

		if(url.length > 0) {
			tit = url;

			var cached = loadValue('bpr-link-' + tit);
			if (cached != null && is_storage) {
				furl = siteroot + cached;
			}

			var cached_book = loadValue('bpr-cached-book-'+tit, 1);
			if (cached_book != null) {
				parseBook(cached_book, 1, 0);
			} else {
				var request = new XMLHttpRequest();
				request.open('GET', furl, true);
				request.onreadystatechange = function() {
					if (request.readyState == 4) {
						if(request.status == 200) {
							parseBook(request.responseText, cached, 1);
						} else {
							if (cached != null)
								reloadBook();
							else {
								tit = 'http error';
								loadBook('Ошибка загрузки книги: ' + request.status + ' ' + request.statusText);
							}
						}
					}
				};
				request.send(null);
			}
		} else	{
			loadBook(gdb('dop').innerHTML + gdb('leg').innerHTML);
			bookloaded = false;
			setTop(0);

			gdb('top100').style.display = 'none';
			gdb('id_add').style.height = (cfg.step - gdb('main').scrollHeight%cfg.step) + 'px';

			gdb('book').focus();
		}
	} catch (e) {
		tit = '';
		loadBook('Ошибка загрузки книги: ' + e.message);
	}
	showTime();
}

