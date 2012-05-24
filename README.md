jquery-data-table
=================

@@version 1.5

This is a very lightweight datatable plugin for bootstrap. The plugin uses AJAX as its exclusive means for retrieving data. It's designed to be used with backend API calls communicating via JSON. I may work on additional features that will allow you to pass in the data separately, but it's already pretty powerful without it. 



How to use it
-------------

Look at the example.html file to see it in action. But the basic premise is this:

```
$("#my-dt-container").datatable({
		url: "data.php"
	,	columns: [
			{
					title: "The heading of your column"
				,	field: "The field the column maps to from the resultset"
			}
		]
})
```

It's recommended to utilize the ID attribute of the container so the datatable can easily operate multiple instances on a single page. Each time the table is rendered/updated the plugin will clear out the current children in the container and redraw the table. 

NOTE: However, one exception to the redraw is during initialization. If you'd like a custom "No Results" element, place it in the container before initializing the datatable on that container. The plugin will take the children of the container and store that as its default message when there is no data in the resultset.


DataTable Options
-----------------

Below are the basic options for creating a new datatable.

+ **debug**: false
[Optional] Pretty self-explanitory, enable this to see certain messages in the console.log. It's a little limited on what I'm currently displaying during debug mode, but that'll change.
+ **id**: undefined
[Optional] The unique ID for the datatable. Recommended to use this, especially when there's more than one table on a page. It also uses this ID when storing the column options to the localStorage
+ **title**: 'Data Table Results'
[Optional] The title heading used if the sectionHeader is not pointed to a proper block element
+ **class**: 'table table-striped table-bordered'
[Optional] This is the class that is applied to the table element.
+ **sectionHeader**: undefined
[Optional] Points to a jQuery object or selector. This is used to attach the table toolbar to.
+ **perPage**: 10
[Optional] How many rows you'd like to display per page of data. Simple enough, right?
+ **pagePadding**: 2
[Optional] This sets how many pages to display to the left and right of the current page.
+ **sort**: [[]]
[Optional] Array of arrays for sorting. This tells the system which columns and in what order the default page call is using. This option can also be passed in from the serverside JSON response.
+ **filter**: {}
[Optional] Tells the system what fields are to be filtered on and with what values to filter with. It's basically a key/value store where the key maps to the column field of the resultset.
+ **post**: {}
[Optional] Passes additional options back with each call to the server.
+ **buttons**: []
[Optional] Array of jQuery buttons that will append themselves to the toolbar. NOTE: If you attach the click event to the button directly, the event only seems to fire before the table is rerendered. It's suggested to bind the events outside the array.
+ **totalRows**: 0
[Optional] Tells the datatable how many total rows are in the full resultset. This is used for pagination, however it can, and most likely will, be passed in from the serverside JSON response.
+ **currentPage**: 1
[Optional] Pagination will start on this page. Also another property that can be passed from the serverside JSON response.
+ **showPagination**: false
[Optional] Boolean option on whether or not to display the pagination.
+ **showTopPagination**: false
[Optional] Boolean option on whether or not to display the pagination above the table.
+ **showHeader**: true
[Optional] Show the column headers? Draws out the <thead> row for all column headers.
+ **showFooter**: false
[Optional] Show the footer? Draws the <tfoot> for the table. Currently, this isn't really implemented. I'm thinking that this will be an element that you can access and implement upon tableCallback()... which is also still something to be added :)
+ **showFilterRow**: false
[Optional] Show the row of filters for selected columns. Currently it only support textbox filters for a column and posts the data back to the server on .change()
+ **filterModal**: undefined
[Optional] HTML block that will display in the modal popup. Used to show additional filter options for the table. NOTE: Events for the Cancel and Save buttons must be written separately. Upon save, you must also apply the values to the options.filter object inorder to pass the new values in.
+ **allowExport**: false
[Optional] TBI - To be implemented
+ **allowOverflow**: true
[Optional] Sets the table wrapper to the size of the container and allows the overflow of the table to scroll. When disabled, the table will stretch the size of the container and may disrupt the layout of the page.
+ **allowMultipleSort**: false
[Optional] When this is enabled, the sort array will hold prior column sorts. If it's disabled, then only one column will be passed as the sort parameter to the server.
+ **toggleColumns**: true
[Optional] Displays a toolbar button below the table that pops up a modal allowing you to show and hide select columns. The default state of a column can be set in the column properties.
+ **url**: 'data.php'
[Required] This is the url that the table will call for it's data. It will post the current sort, filter, and pagination values to the server. Reference the `data.php` page to see how to format the expected JSON response.
+ **columns**: []
[Required] This is an array of column objects that tell the table what field will map to the column, what the heading of the column should be, along with a few other options. See below.
+ **ascending**: '<i class="icon-chevron-up"></i>'
[Optional] This is the HTML for the ASC value of a sorted column
+ **descending**: '<i class="icon-chevron-down"></i>'
[Optional] This is the HTML for the DESC value of a sorted column
+ **rowCallback**: undefined
[Optional] This is a callback function when a row is completed with rendering allowing you to further manipulate the display. It will pass the current row object as the only parameter to the function.
+ **tableCallback**: undefined
[Optional] This is a callback function when the table has completed rendering just prior to being displayed on the page.
+ **headerCallback**: undefined
[Optional] This is a callback function when the header has completed rendering allowing you to further manipulate the columns displayed.
+ **footerCallback**: undefined
[Optional] This is a callback function when the footer has completed rendering allowing you to further manipulate the data for the footer. 
+ **tablePreRender**: undefined
[Optional] This is a function that will be called before the table is rendered to the page. This allows you to dynamically manipulate the columns and data before the table is displayed.









Column Options
--------------

Below are the options when setting up the columns for a new datatable.

+ **title**: ""
[Required] This is the column heading that will be displayed
+ **field**: ""
[Required/Optional] This is the field that maps to the resultset. This is required if the `custom` option is not supplied
+ **custom**: ""
[Required/Optional] This is HTML that you would like to display in the column for ALL rows in the recordset. For instance, a button or link. This is required if the `field` option is not supplied
+ **sortable**: false
[Optional] Tells the table if the column is allowed to be sorted by the user. The column CAN, however, still be passed into the sort array to display that it is currently being sorted. 
+ **callback**: undefined
[Optional] This is a function called whenever the cell of that column is about to be populated with data. This allows you to manipulate the data for that cell via any means. The parameters passed to the function is the data for that row and the properties for that particular column. The return will accept straight HTML or a jquery object.
+ **filter**: false
[Optional] Will display the textbox if the `showFilter` option is enabled for the DataTable.
+ **hidden**: false
[Optional] The initial state of the column for the table. This can be toggled if the `toggleColumns` option is enabled for the DataTable.
+ **css**: {}
[Optional] Object properties for css values for each column cell. This uses the .css() method of a jQuery element so format the object as such.
