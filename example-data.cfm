<cfscript>
  param name="form.perPage" default="10";
  param name="form.currentPage" default="1";
  param name="form.sort" default=[["column_0", "desc"],["column_2", "asc"]];
  param name="form.filter" default={ "column_0" : "foo" };


  total_rows = 200;
  per_page = form.perPage;
  current_page = form.currentPage;
  sort = form.sort;
  filter = form.filter;

writeDump();

  $example = {

    "totalRows"   : total_rows,
    "perPage"     : per_page,
    "sort"        : sort,
    "filter"      : filter,
    "currentPage" : current_page,
    "data"        : array(),

    "posted"      : form

  };


for(i = 1; i <= per_page; i++) {
  current_row = (current_page * per_page) - per_page + i;
  if( current_row > total_rows ) break;

  $example["data"][] = {
    "column_0"  : "row: " . $current_row . " column 1 " . rand(0,100),
    "column_1"  : "row: " . $current_row . " column 2 " . rand(0,100),
    "column_2"  : "row: " . $current_row . " column 3 " . rand(0,100),
    "column_3"  : "row: " . $current_row . " column 4 " . rand(0,100),
  };
}

writeOutput(example);
</cfscript>