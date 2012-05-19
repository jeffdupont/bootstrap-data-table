/*!
 * jQuery Data Table Plugin v1.1
 *
 * Author: Jeff Dupont
 * ==========================================================
 * Copyright 2012 iAcquire, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==========================================================
 */

;(function( $ ){

 /* DATATABLE CLASS DEFINITION
  * ========================== */
  var DataTable = function ( element, options ) {
    this.$element = $(element);
    this.options = options;
    this.enabled = true;
    this.columns = [];
    this.rows = [];

    // set the defaults for the column options array
    for(column in this.options.columns) {
      // check sortable
      if(typeof this.options.columns[column].sortable === undefined) 
        this.options.columns[column].sortable = true;
    }

    this.$default = this.$element.children().length ? 
      this.$element.children() : 
      $("<div></div>")
        .addClass("alert alert-error")
        .html("No Results Found")

    this.render();
  };

  DataTable.prototype = {

      constructor: DataTable

    , render: function () {
        var o = this.options
          , $e = this.$element

        // show loading
        this.loading( true )

        // reset the columns and rows
        this.columns = []
        this.rows    = []
        this.$table  = undefined
        this.$header = undefined
        this.$body   = undefined
        this.$footer = undefined
        this.$pagination = undefined

        // top
        this.$top_details = $("<div></div>")
          .attr("id", "dt-top-details")
        // bottom
        this.$bottom_details = $("<div></div>")
          .attr("id", "dt-bottom-details")

        // localize the object
        var that = this;

        // pull in the data from the ajax call
        if(o.url != "") {
          $.ajax({
              url: o.url
            , type: "POST"
            , dataType: "json"
            , data: {
                  currentPage: o.currentPage
                , perPage: o.perPage
                , sort: o.sort
                , filter: o.filter
              }
            , success: function( res ) {
                that.resultset = res;

                if(res.data.length == 0) {
                  if(that.$default) {
                    $e.empty();
                    $e.html(that.$default);
                  }
                  return;
                }

                // clear out the current elements in the container
                $e.empty();

                // set the sort and filter configuration
                o.sort = res.sort
                o.filter = res.filter
                o.totalRows = res.totalRows

                // set the current page if we're forcing it from the server
                if(res.currentPage) o.currentPage = parseInt(res.currentPage);

                // append the table
                $e.append(that.table());

                // append the detail boxes
                $e.prepend(that.$top_details)
                $e.append(that.$bottom_details)

                // render the rest of the table
                if(o.showHeader)        that.header();
                if(o.showFooter)        that.footer();

                // fill in the table body
                that.body();

                // render the pagination              
                if(o.showTopPagination && that.pagination()) 
                  that.$top_details.append(that.pagination().clone(true));
                if(o.showPagination && that.pagination())    
                  that.$bottom_details.append(that.pagination().clone(true));

                // handle the column management
                if(o.toggleColumns)   initModal.call(that);

                // update the details for the results
                that.details();

                that.loading( false )
              }
            , error: function( e ) {
                if(o.debug) console.log(e);
                showError.call(that);

                that.loading( false )
              }
          })     
        }
      }

    , loading: function ( show ) {
        var $e = this.$element

        if(!this.$loading) {
          this.$loading = $("<div></div>")
            .css({
                position: 'absolute'
              , top: parseInt($e.position().top) + Math.floor($e.height() / 2)
              , left: parseInt($e.position().left) + parseInt($e.css("marginLeft")) + Math.floor($e.width() / 4)
              , width: Math.floor($e.width() / 2) + "px"
            })
            .append(
              $("<div></div>")
                .addClass("progress progress-striped active")
                .append($('<div class="bar" style="width: 100%"></div>'))
            )
            .appendTo(document.body)
        }

        if(show) {
          $e.css({ opacity: 0.2 })
        }
        else {
          $e.css({ opacity: 1 })

          this.$loading.remove()
          this.$loading = undefined
        }
      }

    , details: function () {
        var o = this.options
          , res = this.resultset
          , start = 0
          , end = 0
          , that = this

        // create the div to hold the info
        this.$details = $("<div></div>")
          // .addClass("")
          .appendTo(this.$top_details)

        start = (o.currentPage * o.perPage) - o.perPage + 1
        end = (o.currentPage * o.perPage)
        if(end > o.totalRows) end = o.totalRows

        this.$details.append(
          '<blockquote class="pull-right"><p>Showing ' + start + ' to ' + end + ' of ' + o.totalRows + ' rows</p></blockquote>'
        )

        // per page options and current filter/sorting
        var $perpage_select = $("<select></select>")
          .addClass("span1")
          .css({ marginBottom: '0' })
          .append(
              '<option value="5">5</option>'
            , '<option value="10">10</option>'
            , '<option value="20">20</option>'
            , '<option value="50">50</option>'
            , '<option value="100">100</option>'
          )
          .val(o.perPage)
          .change(function(){
            // update the perpage value
            o.perPage = $(this).val();

            // the offset
            var offset = o.currentPage * o.perPage
            while(offset > o.totalRows) {
              o.currentPage--;
              offset = o.currentPage * o.perPage
            }

            if($(this).popover) $(this).popover('hide')

            // update the table
            that.render();
          })

        var $page_sort = []
          , $page_filter = []

        // sort
        $.each(o.sort, function(i, v){
          var heading
          for(column in o.columns) {
            if(o.columns[column].field == v[0]) heading = o.columns[column].title;
          }
          $page_sort.push( heading + " " + v[1].toUpperCase() )
        })

        // filter
        $.each(o.filter, function(k, v) {
          var heading
          for(column in o.columns) {
            if(o.columns[column].field == k) heading = o.columns[column].title;
          }
          $page_filter.push( heading + " = '" + v + "'" )
        })

        this.$details.append(
            $('<blockquote></blockquote>').append($perpage_select)
          , ''
        )

        $($perpage_select).popover({
            placement: "bottom"
          , content: $('<dl></dl>').append(
                $page_sort.length > 0 ? '<dt><i class="icon-th-list"></i> Sort:</dt><dd>' + $page_sort.join(", ") + '</dd>' : ''
              , o.showFilter && $page_filter.length > 0 ? '<dt><i class="icon-filter"></i> Filter:</dt><dd>' + $page_filter.join(", ") + '</dd>' : ''
            )
        })
      }

    , table: function () {
        var $e = this.$element

        if (!this.$table) {
          this.$table = $('<table></table>')
            .addClass("table table-striped")

          $e.html(this.$table);
        }
        return this.$table;
      }

    , header: function () {
        var o = this.options
          , res = this.resultset

        if(!this.$header) {
          this.$header = $('<thead></thead>')

          // loop through the columns
          for(column in o.columns) {
            var $cell = this.column(column)

            // attach the sort click event
            if(o.columns[column].sortable && !o.columns[column].custom)
              $cell.click(this, this.sort)
                .css({'cursor':'pointer'})

            for(var i = 0; i < o.sort.length; i++) {
              if(o.sort[i][0] == o.columns[column].field) {            
                if(o.sort[i][1] == "asc")
                  $cell.append($(o.ascending))
                else if(o.sort[i][1] == "desc")
                  $cell.append($(o.descending))
              }
            }

            this.$header.append($cell);
            this.columns.push($cell);
          }

          this.table()
            .append(this.$header);
        }
        return this.$header;
      }

    , footer: function () {
        var res = this.resultset

        if(!this.$footer) {
          this.$footer = $('<tfoot></tfoot>')

          this.table()
            .append(this.$footer);
        }
        return this.$footer;
      }

    , body: function () {
        var res = this.resultset
          , o = this.options

        if(!this.$body) {
          this.$body = $('<tbody></tbody>')

          // loop through the results
          for(var i = 0; i < res.data.length; i++) {
            var row = this.row(res.data[i]);
            this.$body.append(row);
            this.rows.push(row);
          }

          if(o.showFilter) this.$body.prepend(this.filter());

          this.table()
            .append(this.$body);
        }
        return this.$body;
      }

    , filter: function () {
        var $row = $("<tr></tr>")
          , o = this.options
          , that = this

        $row.addClass("dt-filter-row");

        // loop through the columns
        for(column in o.columns) {
          var $cell = $("<td></td>")
            .addClass(o.columns[column].classname)

          if(o.columns[column].hidden) $cell.hide();

          if(o.columns[column].filter && o.columns[column].field) {
            $cell
              .append(
                $("<input/>")
                  .attr("name", "filter_" + o.columns[column].field)
                  .data("filter", o.columns[column].field)
                  .val(o.filter[o.columns[column].field] || "")
                  // .change(this, this.runFilter)
                  .change(function(e){
                    runFilter.call(this, that)
                  })
              )
          }

          $row.append($cell);
        }
        return $row;
      }

    , row: function ( rowdata ) {
        var $row = $("<tr></tr>")
          , o = this.options

        // loop through the columns
        for(column in o.columns) {
          var cell = this.cell( rowdata, column );
          $row.append(cell);
        }

        // callback for postprocessing on the row
        if(o.rowCallback && typeof o.rowCallback === "function") 
          $row = o.rowCallback( $row );

        return $row;
      }

    , cell: function ( data, column ) {
        var celldata = data[this.options.columns[column].field] || this.options.columns[column].custom
          , $cell = $('<td></td>')
          , o = this.options

        // preprocess on the cell data for a column
        if(o.columns[column].callback && typeof o.columns[column].callback === "function") 
          celldata = o.columns[column].callback( data, o.columns[column] )

        $cell
          .data("cell_properties", o.columns[column])
          .addClass(o.columns[column].classname)
          .html(celldata || "&nbsp;")

        if(o.columns[column].hidden) $cell.hide();

        return $cell;
      }

    , column: function ( column ) {
        var $cell = $('<th></th>')
          , o = this.options
          , classname = "dt-column_" + column + Math.floor((Math.random()*1000)+1)

        o.columns[column].classname = classname

        $cell
          .data("column_properties", o.columns[column])
          .addClass(classname)
          .text(o.columns[column].title)

        if(o.columns[column].hidden) $cell.hide();

        return $cell;
      }

    , sort: function ( e ) {
        var colprop = $(this).data("column_properties")
          , that = e.data
          , o = e.data.options
          , found = false

        colprop.sortOrder = colprop.sortOrder ? (colprop.sortOrder == "asc" ? "desc" : "") : "asc";

        // does the sort already exist?
        for(var i = 0; i < o.sort.length; i++) {
          if(o.sort[i][0] == colprop.field) {
            o.sort[i][1] = colprop.sortOrder;
            if(colprop.sortOrder == "") o.sort.splice(i,1)
            found = true
          }
        }
        if(!found) o.sort.push([colprop.field, colprop.sortOrder])

        that.render();
      }

    , pagination: function () {
        var $e = this.$element
          , that = this
          , o = this.options
          , res = this.resultset

        // no paging needed
        if(o.perPage >= res.totalRows) return;

        if(!this.$pagination) {
          this.$pagination = $("<div></div>")
            .addClass("pagination pagination-right")

          // how many pages?
          o.pageCount = Math.ceil(res.totalRows / o.perPage)

          // setup the pager container and the quick page buttons
          var $pager = $("<ul></ul>")
            , $first = $("<li></li>").append(
                $("<a></a>")
                  .attr("href", "#")
                  .data("page", 1)
                  .html("&larr; First")
                  .click(function() {
                    o.currentPage = 1
                    that.render();
                  })
              )
            , $previous = $("<li></li>").append(
                $("<a></a>")
                  .attr("href", "#")
                  .data("page", o.currentPage - 1)
                  .text("Prev")
                  .click(function() {
                    o.currentPage -= 1
                    that.render();
                  })
              )
            , $next = $("<li></li>").append(
                $("<a></a>")
                  .attr("href", "#")
                  .data("page", o.currentPage + 1)
                  .text("Next")
                  .click(function() {
                    o.currentPage += 1
                    that.render();
                  })
              )
            , $last = $("<li></li>").append(
                $("<a></a>")
                  .attr("href", "#")
                  .data("page", o.pageCount)
                  .html("Last &rarr;")
                  .click(function() {
                    o.currentPage = o.pageCount
                    that.render();
                  })
              )


          var totalPages = o.pagePadding * 2
            , start
            , end

          if(totalPages >= o.pageCount) {
            start = 1
            end = o.pageCount
          }
          else {
            start = o.currentPage - o.pagePadding
            if(start <= 0) start = 1

            end = start + totalPages
            if(end > o.pageCount) {
              end = o.pageCount
              start = end - totalPages
            }
          }

          // append the pagination links
          for(var i = start; i <= end; i++) {
            var $link = $("<li></li>")
              .append(
                $("<a></a>")
                  .attr("href", "#")
                  .data("page", i)
                  .text(i)
                  .click(function() {
                    o.currentPage = $(this).data('page')
                    that.render();
                  })
              )

              if(i == o.currentPage) $link.addClass("active")

              $pager.append($link);
          }

          // append quick jump buttons
          if(o.currentPage == 1) {
            $first.addClass("disabled")
            $previous.addClass("disabled")
          }
          if(o.currentPage == o.pageCount) {
            $next.addClass("disabled")
            $last.addClass("disabled")
          }
          $pager.prepend($first, $previous);
          $pager.append($next, $last);

          this.$pagination.append($pager);
        }
        return this.$pagination;
      }

  };


 /* DATATABLE PRIVATE METHODS
  * ========================= */

  function showError() {
    var o = this.options
      , $e = this.$element

    $e.empty();
    if(this.$default) $e.append(this.$default);
  }

  function runFilter(that) {
    var o = that.options

    o.filter[$(this).data("filter")] = $(this).val();

    that.render();
  }

  function initModal() {
    var o = this.options
      , $e = this.$element
      , $bottom_details = this.$bottom_details
      , $toggle = $("<a></a>")

    // localize the object
    var that = this;

    if(!this.$modal) {
      this.$modal = $('<div></div>')
        .attr("id", "dt-column-modal_" + Math.floor((Math.random()*100)+1))
        .addClass("modal")
        .hide()

      // render the modal header
      this.$modalheader = $("<div></div>")
        .addClass("modal-header")
        .append(
          $("<button></button>")
            .addClass("close")
            .data("dismiss", "modal")
            .text('x')
            .click(function(){
              that.$modal.modal('hide')
            })
        )
        .append(
          $("<h3></h3>")
            .text("Toggle Columns")
        )

      // render the modal footer
      this.$modalfooter = $("<div></div>")
        .addClass("modal-footer")
        .append(
          $("<a></a>")
            .attr("href", "#")
            .addClass("btn btn-primary")
            .text("Save")
            .click(function(){
              saveColumns.call(that)
            })
        )

      // render the modal body
      this.$modalbody = $("<div></div>")
        .addClass("modal-body")

      // render and add the modal to the container
      this.$modal
        .append(
            this.$modalheader
          , this.$modalbody
          , this.$modalfooter
        )
        .appendTo(document.body);
    }

    // render the display modal button
    $toggle
      .addClass("btn btn-large pull-left")
      .data("toggle", "modal")
      .attr("href", "#" + this.$modal.attr("id"))
      .html("<i class=\"icon-cog\"></i>")
      .click(function(){
        that.$modal
          .on('show', function () {
            _updateColumnModalBody.call(that, that.$modalbody)
          })
          .modal();
      })
    $bottom_details.prepend($toggle);

    return this.$modal;
  }

  function _updateColumnModalBody(body) {
    var o = this.options
      , $container = $("<fieldset></fieldset>")
      , that = this

    // loop through the columns
    for(column in o.columns) {
      var $item = $('<div class="control-group" style="float: left" data-column="' + column + '"><label class="control-label">' + o.columns[column].title + '</label><div class="controls"><div class="btn-group" data-toggle="buttons-radio"><a href="#" class="btn ' + (o.columns[column].hidden ? "" : "active") + '"><i class="icon-ok"></i></a><a href="#" class="btn ' + (o.columns[column].hidden ? "active" : "") + '"><i class="icon-remove"></i></a></div></div></div>')
        .click(function() {
          _toggleColumn.call(this, that)
        })

      $container.append($item);
    }

    body.empty()
    body.append(
      $("<form></form>")
        .addClass("form-horizontal")
        .append($container)
    )
  }

  function _toggleColumn(that) {
    var o = that.options
      , column = $(this).data("column")
      , $column = $("." + o.columns[column].classname)

    if($column.is(":visible")) {
      $column.hide()
      o.columns[column].hidden = true;
    }
    else {
      $column.show()
      o.columns[column].hidden = false;
    }

    $(this)
      .find("a.active")
      .removeClass("active")        

    o.columns[column].hidden ? 
      $(this).find(".icon-remove").parent().addClass("active") :
      $(this).find(".icon-ok").parent().addClass("active")
  }

  function saveColumns() {
    var o = this.options
      , columns = []

    // save the columns to the localstorage
    if(localStorage) {
      localStorage["datatable_" + (o.id || o.url.replace(/\W/ig, '_'))] = o.columns
    }

    $.ajax({
        url: o.url
      , type: "POST"
      , dataType: "json"
      , data: {
            action: "saveColumns"
          , columns: JSON.stringify(o.columns)
          , sort: JSON.stringify(o.sort)
          , filter: JSON.stringify(o.filter)
        }
      , success: function( res ) {
          if(o.debug) console.log("columns saved")
        }
    })

    this.$modal.modal("hide")
  }


 /* DATATABLE PLUGIN DEFINITION
  * =========================== */

  $.fn.datatable = function ( options ) {
    $.fn.datatable.init.call(this, options, DataTable, 'datatable');
    return this;
  };

  $.fn.datatable.init = function ( options, Constructor, name ) {
    var datatable

    if (options === true) {
      return this.data(name);
    } else if (typeof options == 'string') {
      datatable = this.data(name);
      if (datatable) {
        datatable[options]();
      }
      return this;
    }

    options = $.extend({}, $.fn[name].defaults, options);

    function get ( el ) {
      var datatable = $.data(el, name);

      if (!datatable) {
        datatable = new Constructor(el, $.fn.datatable.elementOptions(el, options));
        $.data(el, name, datatable);
      }

      return datatable;
    };

    this.each(function() {
      get(this);
    });

    return this;
  };

  $.fn.datatable.DataTable = DataTable;

  $.fn.datatable.elementOptions = function ( el, options ) {
    return $.metadata ? $.extend({}, options, $(el).metadata()) : options
  };

  $.fn.datatable.defaults = {
    debug: false
  , id: undefined
  , perPage: 10
  , pagePadding: 2
  , sort: [[]]
  , filter: {}
  , totalRows: 0
  , currentPage: 1
  , showPagination: false
  , showTopPagination: false
  , showHeader: true
  , showFooter: false
  , showFilter: false
  , allowExport: false
  , toggleColumns: true
  , url: ''
  , columns: []
  , ascending: '<i class="icon-chevron-up"></i>'
  , descending: '<i class="icon-chevron-down"></i>'
  , rowCallback: undefined
  };


})(window.jQuery);