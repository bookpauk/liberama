<?php

function parseHtml($data, $remove_tags = FALSE) {
    $substs = array(
        //html
        'TD' => chr(9),
        'TH' => chr(9),
        'TR' => chr(13) . chr(10) . '<P>',
        'BR' => chr(13) . chr(10) . '<P>',
        'BR/' => chr(13) . chr(10) . '<P>',
        'DD' => chr(13) . chr(10) . '<P>',
        'P' => chr(13) . chr(10) . '<P>',
        'HR' => chr(13) . chr(10),
        'LI' => chr(13) . chr(10),
        'OL' => chr(13) . chr(10),
        '/OL' => chr(13) . chr(10),
        'TABLE' => chr(13) . chr(10),
        '/TABLE' => chr(13) . chr(10),
        'TITLE' => '<br>&nbsp;',
        '/TITLE' => '<br>&nbsp;',
        'UL' => chr(13) . chr(10) . '     ',
        '/UL' => chr(13) . chr(10),

        // fb2
        'EMPTY-LINE/' => '<P>&nbsp;',
        'STANZA' => '<P>&nbsp;',
        'V' => '<P>',
        '/POEM' => '<P>&nbsp;',
        'SUBTITLE' => '<br>&nbsp;<P>',
        '/SUBTITLE' => '<br>&nbsp;',
    );

    $inner_cut = array(
        'HEAD' => 1,
        'SCRIPT' => 1,
        'STYLE' => 1,
        //fb2
        'BINARY' => 1,
        'DESCRIPTION' => 1,
    );

    if ($remove_tags)
        $substs = $inner_cut = array();


    $data = str_replace('&nbsp;', ' ', $data);

    $i = 0;
    $len = strlen($data);
    $out = '';
    $cut_counter = 0;
    $cut_tag = '';
    while ($i < $len) {
        $left = strpos($data, '<', $i);
        if ($left !== FALSE) {
            $right = strpos($data, '>', $left + 1);
            if ($right !== FALSE) {
                $tag = trim(substr($data, $left + 1, $right - $left - 1));
                $first_space = strpos($tag, ' ');
                if ($first_space !== FALSE)
                    $tag = substr($tag, 0, $first_space);
                $tag = strtoupper($tag);

                if (!$cut_counter) {
                    $out .= substr($data, $i, $left - $i);
                    if (isset($substs[$tag]))
                        $out .= $substs[$tag];
                }

                if (isset($inner_cut[$tag]) && (!$cut_counter || $cut_tag == $tag))
                {
                    if (!$cut_counter)
                        $cut_tag = $tag;
                    $cut_counter++;
                }
                if ($tag != '' && $tag[0] == '/' && $cut_tag == substr($tag, 1)) {
                    $cut_counter = ($cut_counter > 0) ? $cut_counter - 1 : 0;
                    if (!$cut_counter)
                        $cut_tag = '';
                }
                //$close_tag = substr($tag, 1);
                //$out .= "<br>$cut_counter, $cut_tag == $close_tag";

                $i = $right + 1;
            } else
                break;
        }
        else
            break;
    }
    if ($i < $len && !$cut_counter)
        $out .= substr($data, $i, $len - $i);
    return $out;
}

?>
