<?php

$opts = 's::d:u:p:P::a:';

$options = getopt($opts);

if(!isset($options['u']) || !isset($options['d']) || !isset($options['p']) || !isset($options['a'])) {
	show_help();
}

$author = $options['a'];
$username = $options['u'];
$database = $options['d'];
$password = $options['p'];
$server = isset($options['s']) ? $options['s'] : 'localhost';
$port = isset($options['P']) ? $options['P'] : '3306';

var_dump($options);

// Connect to db
$conn = mysql_connect($server.':'.$port, $username, $password);
if(!$conn) {
	die('Could not connect to database ' . mysql_error());
}

// Select database
$db = mysql_select_db($database);
if(!$db) {
	die('Could not select database ' . mysql_error());
}

$rs = mysql_query('select post_date, post_content, post_title, post_name from wp_posts where post_status = \'publish\'');
$nrows = mysql_num_rows($rs);

echo("Found ".$nrows." posts");

mkdir("articles");

for($i=0;$i<$nrows;$i++) {
	$out = "{\n";
	$out .= "\t\"title\" : \"".mysql_result($rs, $i, 'post_title')."\",\n";
	$out .= "\t\"date\" : \"".mysql_result($rs, $i, 'post_date')."\",\n";
	$out .= "\t\"url\" : \"".mysql_result($rs, $i, 'post_name')."\",\n";
	$out .= "\t\"author\" : \"".$author."\"\n";
	$out .= "}\n";
	$out .= "\n";
	$out .= mysql_result($rs, $i, 'post_content');
	$out .= "\n";

	$file = "articles/".mysql_result($rs, $i, 'post_name').".txt";
	echo("Writing post to file ".$file."\n");
	$fh = fopen($file, 'w');
	fwrite($fh, $out);
	fclose($fh);
}



function show_help() {
	echo("Usage:\n");
	echo("\n");
	echo("php wp-export.php -a AUTHOR -s SERVER -d DATABSE -u USER -p PASSWORD -P PORT\n");
	echo("\n");
	echo("Options:\n");
	echo("  -s (Optional) Database URL\n");
	echo("  -P (Optional) Database PORT\n");
	echo("  -d Database name\n");
	echo("  -u Database username\n");
	echo("  -p Database password\n");
	echo("  -a Author of the blog\n");
}
