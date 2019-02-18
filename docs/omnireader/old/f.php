<?php
	date_default_timezone_set('Europe/Moscow');

	require_once 'config/config.php';
	require_once 'parser.php';

	define('LOWERCASE',3);
	define('UPPERCASE',1);

	function getParam($param, $defaultValue = '') {
		$paramValue = (isset($_REQUEST[$param]) ? $_REQUEST[$param] : $defaultValue);
		return $paramValue;
	}

	function getEncoding($str, $check_utf = FALSE) {
		if (!$check_utf) {
			$result = getEncoding(mb_convert_encoding($str, 'cp1251', 'UTF-8'), TRUE);
			if ($result == 'w')
				return 'u';
		}

		$charsets = Array(
			'k' => 0,
			'w' => 0,
			'd' => 0,
			'i' => 0,
			'm' => 0
		);

		$length = strlen($str);
		$block_size = ($length > 5*3000) ? 3000 : $length;
		$counter = 0;
		for ( $i = 0; $i < $length; $i++ ) {
			$char = ord($str[$i]);

			//non-russian characters
			if ($char < 128 || $char > 256)
				continue;
			//CP866
			if (($char > 159 && $char < 176) || ($char > 223 && $char < 242)) $charsets['d']+=LOWERCASE;
			if (($char > 127 && $char < 160)) $charsets['d']+=UPPERCASE;

			//KOI8-R
			if (($char > 191 && $char < 223)) $charsets['k']+=LOWERCASE;
			if (($char > 222 && $char < 256)) $charsets['k']+=UPPERCASE;

			//WIN-1251
			if ($char > 223 && $char < 256) $charsets['w']+=LOWERCASE;
			if ($char > 191 && $char < 224) $charsets['w']+=UPPERCASE;

			//MAC
			if ($char > 221 && $char < 255) $charsets['m']+=LOWERCASE;
			if ($char > 127 && $char < 160) $charsets['m']+=UPPERCASE;

			//ISO-8859-5
			if ($char > 207 && $char < 240) $charsets['i']+=LOWERCASE;
			if ($char > 175 && $char < 208) $charsets['i']+=UPPERCASE;

			$counter++;
			if ($counter > $block_size) {
				$counter = 0;
				$i += (int)($length/2 - 2*$block_size);
			}
		}

		arsort($charsets);
		if (preg_match('//u', $str))
			return 'u';
		else
			return key($charsets);
	}

	function getTag($tagName, $book) {
		$from_tag = '<' . $tagName . '>';
		$to_tag = '</' . $tagName . '>';
		$from = strpos($book, $from_tag);
		$to = strpos($book, $to_tag);
		if ($from === FALSE || $to === FALSE)
			return '';
		$from += strlen($from_tag);
		return trim(substr($book, $from, $to - $from));
	}

	function getMetaInfoAndFilter($book, &$meta_info) {
		$meta_info['author'] = '';
		$meta_info['title'] = getTag('title', $book);

		$out = $book;

		//fb2 ??? ---------------------
		if (strpos($meta_info['title'], '<p>') !== FALSE) {
			$s = str_replace('</p>', '', $meta_info['title']);
			$a = explode('<p>', $s);
			$meta_info['author'] = parseHtml($a[1], TRUE);
			$meta_info['title'] = parseHtml($a[2], TRUE);
			if ($meta_info['title'] === NULL || $meta_info['title'] === '') {
				$s = parseHtml($s, TRUE);
				$meta_info['author'] = '';
				$meta_info['title'] = $s;
			}
		}

		//samlib ----------------------
		$samlib_start_sign = '<!----------- Собственно произведение --------------->';
		$samlib_book_idx = strpos($book, $samlib_start_sign);
		if ($samlib_book_idx !== FALSE) {
			$samlib_author = getTag('h3', $book);
			$meta_info['author'] = substr($samlib_author, 0, strpos($samlib_author, ': <small>'));
			$meta_info['title'] = getTag('h2', $book);;
			$samlib_book_idx += strlen($samlib_start_sign);
			$samlib_book_end_idx = strpos($book, '<!---- Блок описания произведения (слева внизу) ----------------------->');
			$samlib_book_end_idx = ($samlib_book_end_idx === FALSE ? strlen($book) : $samlib_book_end_idx);
			$out = '<dd>' . $meta_info['author'] . '<dd>' . $meta_info['title'] . '<empty-line/>' .
				substr($book, $samlib_book_idx, $samlib_book_end_idx - $samlib_book_idx);
			$out = preg_replace("/<dd>&nbsp;&nbsp[;]*\s*[\r\n]/", '<empty-line/>', $out);
		}

		return $out;
	}

	function filterTextAndGzip($meta_info, $txtin) {
		global $use_gzip;

		if (strpos($txtin, '<P>') === FALSE) {
			$len = strlen($txtin);
			$counts = array();

			$flag = 0;
			$c = 0;
			for ($i = 0; $i < $len; $i++) {
				if ($txtin[$i] == chr(10) || $i == 0) {
					$counts[$c]++;
					if ($c > 0)
						$counts[0]++;
					$c = 0;
					$flag = 1;
				} else
					if ($txtin[$i] != ' ')
						$flag = 0;
					else
						if ($flag)
							$c++;
			}

			arsort($counts);
			$key = 0;
			if (count($counts) > 1) {
				next($counts);
				$key = key($counts);
			}

			//$txtout .= print_r($counts, TRUE);
			//$txtout .= $key;

			$txtout = '';
			$flag = 0;
			$c = 0;
			for ($i = 0; $i < $len; $i++) {
				if ($txtin[$i] == chr(10) || $i == 0) {
					$c = 0;
					$flag = 1;
				} else
					if ($txtin[$i] != ' ') {
						if ($c >= $key && $flag)
							$txtout .= '<p>';
						$flag = 0;
					}
					else
						if ($flag)
							$c++;
				$txtout .= $txtin[$i];
			}
		} else
			$txtout = $txtin;

		$txtout = 'no_file' . '|' . $meta_info['author'] . '|' . $meta_info['title'] .
			'<<<bpr5A432688AB0467AA396E5A144830248Abpr>>>' . $txtout;

		$supportsGzip = strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== false;
		if ($use_gzip && $supportsGzip && getParam('meta') == '' && getParam('curl') == '') {
			$txtout = gzencode($txtout, 9);
			header('Content-Encoding: gzip');
		}

		return $txtout;
	}

	function myErrorHandler($errno, $errstr, $errfile, $errline)
	{
		if (!(error_reporting() & $errno)) {
			// Этот код ошибки не включен в error_reporting
			return;
		}

		if ($errno == 8 /*|| $errno == 2*/)
			return;
		//throw new Exception("[$errno]: ($errstr) at $errfile line $errline");
		throw new Exception("$errstr");

		// Не запускаем внутренний обработчик ошибок PHP
		return TRUE; // сюда хода нет, но пусть будет как шаблон
	}

	function unzip($filein) {
		$zip = new ZipArchive;
		$result = '';
		if ($zip->open($filein) === TRUE) {
			$filename = '';
			$max_size = -1;
			for($i = 0; $i < $zip->numFiles; $i++) {
				$stat = $zip->statIndex($i);
				$size = $stat['size'];
				if ($size > $max_size) {
					$max_size = $size;
					$filename = $zip->getNameIndex($i);
					$fp = $zip->getStream($filename);
					if (!$fp)
						throw new Exception("zip->getStream failed");
					$result = stream_get_contents($fp);
					fclose($fp);
				}
			}
			$zip->close();
		} else
			throw new Exception("zip->open failed");

		return $result;
	}

	function create_guid($namespace = '') {
		$uid = md5(uniqid("", true));
		$data = $namespace;
		$data .= $_SERVER['REQUEST_TIME'];
		$data .= $_SERVER['HTTP_USER_AGENT'];
		$data .= $_SERVER['LOCAL_ADDR'];
		$data .= $_SERVER['LOCAL_PORT'];
		$data .= $_SERVER['REMOTE_ADDR'];
		$data .= $_SERVER['REMOTE_PORT'];
		$hash = strtoupper(hash('ripemd128', $uid . $guid . md5($data)));
		return $hash;
	}

	function microtime_float()
	{
		list($usec, $sec) = explode(" ", microtime());
		return ((float)$usec + (float)$sec);
	}

	function curlExec(/* Array */$curlOptions='', /* Array */$curlHeaders='', /* Array */$postFields='')
	{
	  $newUrl = '';
	  $maxRedirection = 10;
	  do
	  {
		if ($maxRedirection<1) die('Error: reached the limit of redirections');

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		if (!empty($curlOptions)) curl_setopt_array($ch, $curlOptions);
		if (!empty($curlHeaders)) curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
		if (!empty($postFields))
		{
		  curl_setopt($ch, CURLOPT_POST, 1);
		  curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
		}

		if (!empty($newUrl)) curl_setopt($ch, CURLOPT_URL, $newUrl); // redirect needed
		curl_setopt($ch, CURLOPT_HEADER, 1);

		$response = curl_exec($ch);
		// Then, after your curl_exec call:
		$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
		$header = substr($response, 0, $header_size);
		$curlResult = substr($response, $header_size);

		$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$info = curl_getinfo($ch);
		if (getParam('curl') != '') {;
			throw new Exception("<br>" . str_replace("[", "<br>[", print_r($info, TRUE)) . "<br>$header<br>END");
		}

		if ($code == 301 || $code == 302 || $code == 303 || $code == 307)
		{
			if (array_key_exists('redirect_url', $info) && !empty($info['redirect_url'])) {
				$newUrl = trim($info['redirect_url']);
			} else {
				preg_match('/Location:(.*?)\n/', $header, $matches);
				$newUrl = trim(array_pop($matches));
			}
		  curl_close($ch);

		  $maxRedirection--;
		  continue;
		}
		else // no more redirection
		{
			if ($curlResult === FALSE || $info['http_code'] != 200) {
				$curlResult = "ERROR ". $info['http_code'];
				if (curl_error($ch))
					$curlResult .= "<br>". curl_error($ch);
				throw new Exception($curlResult);
			} else {
				$code = 0; //OK
				curl_close($ch);
			}
		}
	  }
	  while($code);
	  return $curlResult;
	}
{
	set_error_handler("myErrorHandler");
//	set_time_limit(300);

	$url = getParam('url');
	try {
		$body = '';
		if ($url == '')
			throw new Exception("не задан адрес книги");

		$meta_info = array();
		$time_start = $time = microtime_float();

		$pid = create_guid();
		$dir = 'txt/';
		$encoding = getParam('encoding');

		if (strpos($url, 'http://') !== 0 && strpos($url, 'https://') !== 0)
			$url = 'http://' . $url;
		$url = str_replace('"', '', $url);
		$url = str_replace('\'', '', $url);
		$url = str_replace(']', '%5D', str_replace('[', '%5B', $url));

		$options = array(
			CURLOPT_RETURNTRANSFER => TRUE,
			CURLOPT_TIMEOUT => 300,
			CURLOPT_URL => $url,
			CURLOPT_BUFFERSIZE => 1024*128,
			CURLOPT_NOPROGRESS => FALSE,
			CURLOPT_USERAGENT => "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6",
			CURLOPT_PROGRESSFUNCTION => function(
				$DownloadSize, $Downloaded, $UploadSize, $Uploaded
			) {
				// If $Downloaded exceeds, returning non-0 breaks the connection!
				return ($Downloaded > (50 * 1024 * 1024)) ? 1 : 0;
			}
		);

		$out = curlExec($options);

		$meta_info['time_curl'] = microtime_float() - $time;
		$time = microtime_float();

		//zip
		if ($out[0] == chr(0x50) && $out[1] == chr(0x4B) && $out[2] == chr(0x03) && $out[3] == chr(0x04)) {
			$zipped_file = $tmp_dir . "/{$pid}-temp.zip";
			file_put_contents($zipped_file, $out);
			$out = unzip($zipped_file);
			if (file_exists($zipped_file)) unlink($zipped_file);
		}

		//pdf
/*        if ($out[0] == chr(0x25) && $out[1] == chr(0x50) && $out[2] == chr(0x44) && $out[3] == chr(0x46)) {
			$a = new PDF2Text();
			$a->reset();
			$a->decodePDF($out);
			$out = $a->output();
			file_put_contents('/tmp/1', $out);
		}*/

		$meta_info['time_unzip'] = microtime_float() - $time;
		$time = microtime_float();

		//decoding and parsing
		if ($out !== FALSE) {
			if ($encoding == '')
				$encoding = getEncoding($out);

			switch ($encoding) {
				case 'k':
					$out = mb_convert_encoding($out, 'cp1251', 'KOI8-R');
					break;
				case 'w':
					break;
				case 'd':
					$out = mb_convert_encoding($out, 'cp1251', 'cp866');
					break;
				case 'i':
					$out = mb_convert_encoding($out, 'cp1251', 'ISO-8859-5');
					break;
				case 'm':
					$out = mb_convert_encoding($out, 'cp1251', 'MACINTOSH');
					break;
				case 'u':
					$out = mb_convert_encoding($out, 'cp1251', 'UTF-8');
					break;
			}
			//$out = $encoding . '===' . $out;

//file_put_contents('/tmp/bpr1', $out);
			$meta_info['time_decodepage'] = microtime_float() - $time;
			$time = microtime_float();

			$out = getMetaInfoAndFilter($out, $meta_info);

			$meta_info['time_metainfo'] = microtime_float() - $time;
			$time = microtime_float();

			$out = parseHtml($out);

			$meta_info['time_parsehtml'] = microtime_float() - $time;
			$time = microtime_float();

			$out = filterTextAndGzip($meta_info, $out);

			$meta_info['time_filter_gzip'] = microtime_float() - $time;
			$meta_info['time_total'] = microtime_float() - $time_start;

			$meta = getParam('meta');
			if ($meta != '') {
				$info = '';
				foreach ($meta_info as $key => $value) {
					if (strpos($key, 'time') !== FALSE)
						$info .= sprintf("%06.3f", $value) . " $key <br>";
					else
						$info .= "$key: $value<br>";
				}
				throw new Exception("<br>" . $info);
			}

			header('Content-Type: text/plain; charset=windows-1251');
			echo $out;
//file_put_contents('/tmp/bpr2', $out);
			return;
		} else
			throw new Exception("ошибка загрузки файла. Попробуйте еще раз.");
	} catch (Exception $e) {
		header('Content-Type: text/html; charset=windows-1251');
		$err = $e->getMessage();
		if (strpos($err, 'ERROR 404') !== FALSE)
			  $err = 'страница не найдена';
		$body = "Ошибка загрузки книги: " . ($url == '' ? '' : "($url) ") . $err;
	}
	echo $body;
}
?>
