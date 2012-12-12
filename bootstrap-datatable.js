/*!
 * Bootstrap Data Table Plugin v1.5.2
 *
 * Author: Jeff Dupont
 * ==========================================================
 * Copyright 2012
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
    this.buttons = [];

    this.localStorageId = "datatable_" + (options.id || options.url.replace(/\W/ig, '_'))

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

    this.$element.addClass("clearfix")

    // clear out the localStorage for this entry
    if(localStorage) {
      localStorage[this.localStorageId] = 'false'
    }

    if(this.options.autoLoad === true) this.render();
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
        this.buttons = []
        this.$wrapper    = undefined
        this.$table      = undefined
        this.$header     = undefined
        this.$body       = undefined
        this.$footer     = undefined
        this.$pagination = undefined

        if(this.$toolbar) this.$toolbar.remove();

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
            , data: $.extend({}, o.post, {
                  currentPage: o.currentPage
                , perPage: o.perPage
                , sort: o.sort
                , filter: o.filter
              })
            , success: function( res ) {
                if(o.debug) console.log(res);

                if(!res || res === undefined) {
                  showError.call(that);
                  return;
                }

                that.resultset = res;

                if(!res.data || res.data.length == 0) {
                  showError.call(that);
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

                if(o.tablePreRender && typeof o.tablePreRender === 'function')
                  o.tablePreRender.call(that)

                // retrieve the saved columns
                _retrieveColumns.call(that, localStorage['boo'])//that.localStorageId])

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

                // update the details for the results
                that.details();

                // initialize the toolbar
                _initToolbar.call(that)

                // nearly complete... let the user apply any final adjustments
                if(o.tableCallback && typeof o.tableCallback === 'function')
                  o.tableCallback.call(that)

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
              , top: parseInt($e.position().top) + 5
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

    , toolbar: function () {
        var o = this.options
          , $e = this.$element
          , that = this

        this.$toolbar = $("<div></div>")
          .addClass("dt-toolbar btn-toolbar pull-right")

        this.$button_group = $("<div></div>")
          .addClass("btn-group")
          .appendTo(this.$toolbar)

        // add all the custom buttons
        for(var i = 0; i < o.buttons.length; i++) {
          this.buttons.push(o.buttons[i]);
        }

        // attach all buttons to the toolbar
        $.each(this.buttons, function() {
          that.$button_group.append(this);
        })

        // attach the toolbar to the section header
        if(o.sectionHeader) {
          this.$section_header = $(o.sectionHeader);
          this.$section_header.append(this.$toolbar)
        }
        else if(o.title != '' && !this.$section_header) {
          this.$section_header = $("<h2></h2>")
            .text(o.title)
            .append(this.$toolbar)
          $e.before(this.$section_header)
        }
        else {
          if(!this.$section_header) {
            this.$section_header = $("<div></div>")
          }
          this.$section_header.append(this.$toolbar)
        }

        return this.$toolbar
      }

    , details: function () {
        var o = this.options
          , res = this.resultset
          , start = 0
          , end = 0
          , that = this

        start = (o.currentPage * o.perPage) - o.perPage + 1
        end = (o.currentPage * o.perPage)
        if(end > o.totalRows) end = o.totalRows

        $('<div class="pull-left"><p>Showing ' + start + ' to ' + end + ' of ' + o.totalRows + ' rows</p></div>')
          .prependTo(this.$bottom_details)
      }

    , table: function () {
        var $e = this.$element
          , o = this.options

        if(!this.$table_wrapper) {
          this.$wrapper = $("<div></div>")
            .addClass("dt-table-wrapper")
        }

        if (!this.$table) {
          this.$table = $('<table></table>')
            .addClass(o.class)
        }

        this.$wrapper.append(this.$table);
        return this.$wrapper;
      }

    , header: function () {
        var o = this.options
          , res = this.resultset

        if(!this.$header) {
          this.$header = $('<thead></thead>')

          // loop through the columns
          for(column in o.columns) {
            var $cell = this.column(column)
              , colprop = $cell.data("column_properties")

            // attach the sort click event
            if(colprop.sortable && !colprop.custom)
              $cell.click(this, this.sort)
                .css({'cursor':'pointer'})

            for(var i = 0; i < o.sort.length; i++) {
              if(o.sort[i][0] == colprop.field) {
                if(o.sort[i][1] == "asc") {
                  $cell.append($(o.ascending))
                  colprop.sortOrder = "asc"
                }
                else if(o.sort[i][1] == "desc") {
                  $cell.append($(o.descending))
                  colprop.sortOrder = "desc"
                }
              }
            }

            this.$header.append($cell);
            this.columns.push($cell);
          }

          // any final user adjustments to the header
          if(o.headerCallback && typeof o.headerCallback === 'function')
            o.headerCallback.call(this)

          this.$table
            .append(this.$header);
        }
        return this.$header;
      }

    , footer: function () {
        var res = this.resultset

        if(!this.$footer) {
          this.$footer = $('<tfoot></tfoot>')

          // any final user adjustments to the footer
          if(o.footerCallback && typeof o.footerCallback === 'function')
            o.footerCallback.call(this)

          this.$table
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

          if(o.showFilterRow) this.$body.prepend(this.filter());

          this.$table
            .append(this.$body);
        }
        return this.$body;Row
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
          $row = o.rowCallback( $row, rowdata );

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

        if(o.columns[column].css) $cell.css(o.columns[column].css);

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

        if(o.columns[column].css) $cell.css(o.columns[column].css);

        if(o.columns[column].hidden) $cell.hide();

        return $cell;
      }

    , sort: function ( e ) {
        var colprop = $(this).data("column_properties")
          , that = e.data
          , o = e.data.options
          , found = false

        colprop.sortOrder = colprop.sortOrder ? (colprop.sortOrder == "asc" ? "desc" : "") : "asc";

        if(o.allowMultipleSort) {
          // does the sort already exist?
          for(var i = 0; i < o.sort.length; i++) {
            if(o.sort[i][0] == colprop.field) {
              o.sort[i][1] = colprop.sortOrder;
              if(colprop.sortOrder == "") o.sort.splice(i,1)
              found = true
            }
          }
          if(!found) o.sort.push([colprop.field, colprop.sortOrder])
        }
        else {
          // clear out any current sorts
          o.sort = [];
          o.sort.push([colprop.field, colprop.sortOrder])
        }
        if(o.debug) console.log(o.sort);

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
                    return false;
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
                    return false;
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
                    return false;
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
                    return false;
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
                    return false;
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

  function _initToolbar() {
    var o = this.options

    // create the perpage dropdown
    _initPerPage.call(this);

    // handle filter options
    if(o.filterModal)     _initFilterModal.call(this);

    // handle the column management
    if(o.toggleColumns)   _initColumnModal.call(this);

    // handle the overflow option
    if(o.allowOverflow)   _initOverflowToggle.call(this);

    // initialize the table info
    if(o.allowTableinfo)   _initTableInfo.call(this);

    // create the buttons and section functions
    this.toolbar();
  }

  function _initColumnModal() {
    var o = this.options
      , $e = this.$element
      , $top_details = this.$top_details
      , $toggle = $("<a></a>")

    // localize the object
    var that = this;

    if(!this.$column_modal) {
      this.$column_modal = $('<div></div>')
        .attr("id", "dt-column-modal_" + Math.floor((Math.random()*100)+1))
        .addClass("modal")
        .hide()

      // render the modal header
      this.$column_modalheader = $("<div></div>")
        .addClass("modal-header")
        .append(
          $("<button></button>")
            .addClass("close")
            .data("dismiss", "modal")
            .text('x')
            .click(function() {
              that.$column_modal.modal('hide')
            })
        )
        .append(
          $("<h3></h3>")
            .text("Toggle Columns")
        )

      // render the modal footer
      this.$column_modalfooter = $("<div></div>")
        .addClass("modal-footer")
        .append(
          $("<a></a>")
            .attr("href", "#")
            .addClass("btn btn-primary")
            .text("Save")
            .click(function() {
              _saveColumns.call(that)
              return false;
            })
        )

      // render the modal body
      this.$column_modalbody = $("<div></div>")
        .addClass("modal-body")

      // render and add the modal to the container
      this.$column_modal
        .append(
            this.$column_modalheader
          , this.$column_modalbody
          , this.$column_modalfooter
        )
        .appendTo(document.body);
    }

    // render the display modal button
    $toggle
      .addClass("btn")
      .data("toggle", "modal")
      .attr("href", "#" + this.$column_modal.attr("id"))
      .html("<i class=\"icon-cog\"></i>")
      .click(function(e) {
        that.$column_modal
          .on('show', function () {
            _updateColumnModalBody.call(that, that.$column_modalbody)
          })
          .modal();
        return false;
      })
    this.buttons.unshift($toggle);

    return this.$column_modal;
  }

  function _initFilterModal() {
    var o = this.options
      , $e = this.$element
      , $toggle = $("<a></a>")

    o.filterModal.hide();

    // render the display modal button
    $toggle
      .addClass("btn")
      .data("toggle", "modal")
      .attr("href", "#")
      .html("<i class=\"icon-filter\"></i>")
      .click(function() {
        $(o.filterModal)
          .modal();
        return false;
      })
    this.buttons.unshift($toggle);
  }

  function _initPerPage() {
    var o = this.options
      , $e = this.$element
      , that = this

    // per page options and current filter/sorting
    var $perpage_select = $("<a></a>")
      .addClass("btn dropdown-toggle")
      .attr("data-toggle", "dropdown")
      .html(o.perPage + "&nbsp;")
      .css({ fontWeight: 'normal' })
      .append(
        $("<span></span>")
          .addClass("caret")
      )
    this.buttons.push($perpage_select)

    var $perpage_values = $("<ul></ul>")
      .addClass("dropdown-menu")
      .css({ fontSize: 'initial', fontWeight: 'normal' })
      .append(
          $('<li data-value="5"><a href="#">5</a></li>')
            .click(function() { _updatePerPage.call(this, that); return false; })
        , $('<li data-value="10"><a href="#">10</a></li>')
            .click(function() { _updatePerPage.call(this, that); return false; })
        , $('<li data-value="20"><a href="#">20</a></li>')
            .click(function() { _updatePerPage.call(this, that); return false; })
        , $('<li data-value="50"><a href="#">50</a></li>')
            .click(function() { _updatePerPage.call(this, that); return false; })
        , $('<li data-value="100"><a href="#">100</a></li>')
            .click(function() { _updatePerPage.call(this, that); return false; })
      )
    this.buttons.push($perpage_values)
  }

  function _initTableInfo() {
    var o = this.options
      , $e = this.$element
      , $info = $("<a></a>")

    // render the display modal button
    $info
      .addClass("btn")
      .attr("href", "#")
      .html("<i class=\"icon-info-sign\"></i>")
      .click(function() {
        return false;
      })

    var $page_sort = []
      , $page_filter = []

    // sort
    $.each(o.sort, function(i, v){
      if(!v.length) return;
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
      $page_filter.push( (heading || k) + " = '" + v + "'" )
    })

    $($info).popover({
        placement: "bottom"
      , content: $('<dl></dl>').append(
            $page_sort.length > 0 ? '<dt><i class="icon-th-list"></i> Sort:</dt><dd>' + $page_sort.join(", ") + '</dd>' : ''
          , $page_filter.length > 0 ? '<dt><i class="icon-filter"></i> Filter:</dt><dd>' + $page_filter.join(", ") + '</dd>' : ''
        )
    })

    this.buttons.unshift($info);
  }

  function _initOverflowToggle() {
    var o = this.options
      , $wrapper = this.$wrapper
      , $overflow = $("<a></a>")

    // create the button
    $overflow
      .addClass("btn")
      .attr("href", "#")
      .html("<i class=\"icon-resize-full\"></i>")
      .click(function() {
        _toggleOverflow.call(this, $wrapper);
        return false;
      })
    this.buttons.push($overflow)
  }

  function _toggleOverflow(el) {
    if(el.css('overflow') == 'scroll') {
      $(this).children("i")
        .attr("class", "icon-resize-full")

      el.css({
          overflow: 'visible'
        , width: 'auto'
      })
    }
    else {
      $(this).children("i")
        .attr("class", "icon-resize-small")

      el.css({
          overflow: 'scroll'
        , width: el.width()
      })
    }
  }

  function _updatePerPage(that) {
    var o = that.options

    // update the perpage value
    o.perPage = $(this).data("value");

    // the offset
    var offset = o.currentPage * o.perPage
    while(offset > o.totalRows) {
      o.currentPage--;
      offset = o.currentPage * o.perPage
    }

    if($(this).popover) $(this).popover('hide')

    // update the table
    that.render();

    return false;
  }

  function showError() {
    var o = this.options
      , $e = this.$element

    // initialize the toolbar
    _initToolbar.call(this)

    // nearly complete... let the user apply any final adjustments
    if(o.tableCallback && typeof o.tableCallback === 'function')
      o.tableCallback.call(this)

    this.loading( false );

    $e.empty();
    if(this.$default) $e.append(this.$default);
  }

  function runFilter(that) {
    var o = that.options

    o.filter[$(this).data("filter")] = $(this).val();
    if(o.debug) console.log(o.filter);

    that.render();
  }

  function _updateColumnModalBody(body) {
    var o = this.options
      , $container = $("<fieldset></fieldset>")
      , that = this

    // loop through the columns
    for(column in o.columns) {
      if(o.columns[column].title == "") continue;
      var $item = $('<div class="control-group" style="float: left" data-column="' + column + '"><label class="control-label">' + o.columns[column].title + '</label><div class="controls"><div class="btn-group" data-toggle="buttons-radio"><a href="#" class="btn ' + (o.columns[column].hidden ? "" : "active") + '"><i class="icon-ok"></i></a><a href="#" class="btn ' + (o.columns[column].hidden ? "active" : "") + '"><i class="icon-remove"></i></a></div></div></div>')
        .click(function() {
          _toggleColumn.call(this, that)
          return false;
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

    return false;
  }

  function _saveColumns() {
    var o = this.options
      , columns = []

    // save the columns to the localstorage
    if(localStorage) {
      localStorage[this.localStorageId] = JSON.stringify(o.columns)
    }

    $.ajax({
        url: o.url
      , type: "POST"
      , dataType: "json"
      , data:  $.extend({}, o.post, {
            action: "save-columns"
          , columns: JSON.stringify(o.columns)
          , sort: JSON.stringify(o.sort)
          , filter: JSON.stringify(o.filter)
        })
      , success: function( res ) {
          if(o.debug) console.log("columns saved")
        }
    })

    this.$column_modal.modal("hide")
  }

  function _retrieveColumns(data) {
    var o = this.options
      , columns = data ? JSON.parse(data) : []
      , res = this.resultset

    for(column in o.columns) {
      o.columns[column] = $.extend({}, o.columns[column], (res.columns ? res.columns[column] : []), columns[column]);
    }
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
  , title: 'Data Table Results'
  , class: 'table table-striped table-bordered'
  , perPage: 10
  , pagePadding: 2
  , sort: [[]]
  , filter: {}
  , post: {}
  , buttons: []
  , sectionHeader: undefined
  , totalRows: 0
  , currentPage: 1
  , showPagination: false
  , showTopPagination: false
  , showHeader: true
  , showFooter: false
  , showFilterRow: false
  , filterModal: undefined
  , allowExport: false
  , allowOverflow: true
  , allowMultipleSort: false
  , toggleColumns: true
  , url: ''
  , columns: []
  , ascending: '<i class="icon-chevron-up"></i>'
  , descending: '<i class="icon-chevron-down"></i>'
  , rowCallback: undefined
  , tableCallback: undefined
  , headerCallback: undefined
  , footerCallback: undefined
  , tablePreRender: undefined
  , autoLoad: true
  };


})(window.jQuery);