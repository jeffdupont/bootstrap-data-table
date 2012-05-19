<?php

$total_rows = 200;
$per_page = $_POST["perPage"] ?: 10;
$current_page = $_POST["currentPage"] ?: 1;

$sort = $_POST["sort"] ?: array(array( "column_0", "desc" ), array( "column_2", "asc" ));
$filter = $_POST["filter"] ?: array("column_0" => "foo");

$example = array(

  "totalRows"   => $total_rows,
  "perPage"     => $per_page,
  "sort"        => $sort,
  "filter"      => $filter,
  "currentPage" => $current_page,
  "data"        => array(),

  "posted"      => $_POST

);


for($i = 1; $i <= $per_page; $i++) {
  $current_row = ($current_page * $per_page) - $per_page + $i;
  if($current_row > $total_rows) break;

  $example["data"][] = array(
    "column_0"  => "row: " . $current_row . " column 1 " . rand(0,100),
    "column_1"  => "row: " . $current_row . " column 2 " . rand(0,100),
    "column_2"  => "row: " . $current_row . " column 3 " . rand(0,100),
    "column_3"  => "row: " . $current_row . " column 4 " . rand(0,100),
  );
}

echo json_encode($example);
