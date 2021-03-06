//#!本文件由share.js自动产生于Sun Apr 20 2014 22:13:27 GMT+0800 (CST), 产生命令行为: node share.js gen paintings CRUD ..

// Page状态对象
var PG = new $P({
    default :{
        // 查询条件
        cond : { deleted : { $ne : true } },
        type : 'tag1',
        // 翻页条件
        page : { skip: 0, limit: 10 },
        // 排序字段
        sort : { by: '_id', order : -1 },
    },

    bind: function(){
        this.bindhash();
        $(PG).on('statechange', Module.onPageStateChange);
    }
});

var Module = $.extend(new $M(), {

    // =========================================================================
    //  PageStateChage是功能的入口,一般由某个界面事件触发出状态改变，再由状态的改变，
    //  触发某个页面载入动作或者是重新渲染
    // =========================================================================
    onPageStateChange : function (){
        var state = PG.state;
        
        // 初始化页面各个控件的状态
        Module.applyPageState(state);
        // 载入数据
        Module.loadPageData(state.cond, state.page);
    },

    applyPageState : function(state){
        // 初始化查询条件
        $('#search-form').clearall().autofill(state.cond);
        $('#detail-search-form').clearall().autofill(state.cond);

        var type = PG.state.type;
        // TODO: 根据Type决定显示类型
    },

    //根据页面状态，载入数据
    loadPageData: function(stateCond, page){
        $('#cellTable').spin();
        var type = PG.state.type,
            title = type + '数据',
            editing = PG.state.editing,
            sort = PG.state.sort 
            sortarg = {},
            cond = $.extend({},stateCond);
        sortarg[sort.by] = sort.order;

        // 处理需要做正则表达式查询的条件
        if(cond.queryword){
            var reg = 'Reg(' + cond.queryword + ')';
            cond.$or = [ { paintingName : reg } , { author : reg }, { age : reg } ];
            delete cond.queryword;
        }
        // 处理未激活状态的查询
        if(cond.active && cond.active === 'false'){
            cond.active = { $ne : true };
        }

        Module.listPage(type, cond, sortarg, page
            , function(module){
                var $resultTarget = $('#cellTable');
                $M.fillResult($resultTarget, {
                    columns : Module.columns ,
                    cells : module.docs,
                    title : type.toUpperCase() + "数据",
                    bodyId: 'paintingsCellTbody',
                    tempId: 'paintingsCellTable',
                    sort: sort,
                });
                $('#cellTable').spin(false);
                
                if(editing === 'true'){
                    $('.action-ctl').addClass('show-action-ctl').removeClass('action-ctl');
                    $('#enableEditBtn').closest('li').addClass('active');
                }else{
                    $('.action-ctl').addClass('action-ctl').removeClass('show-action-ctl');;
                    $('#enableEditBtn').closest('li').removeClass('active');
                }
            });

        Module.showPagebar(type, cond, page
            , function(html){
                var $pagebar = $('.pagebar');
                $pagebar.empty().append(html);
            });
    },


    // 页面载入的时候绑定各个事件
    bind : function(){
        $('a.importbtn').on('click', function(e){
            Module.onImportFile();
        });
        $('nav.sub-navbar').affix({ 
            offset: { top: 50 } 
        }).on('affix.bs.affix', function(e){
            $('#mainContent').addClass('affixed');
            $('div.main-navbar').addClass('moveout');
        }).on('affix-top.bs.affix', function(e){
            $('#mainContent').removeClass('affixed');
            $('div.main-navbar').removeClass('moveout');
        });
        $('#search-form').keypress(function(e){
            if ( event.which == 13 ) {
                e.preventDefault();
                var search = $('#search-form').getdata({skipEmpty : true});
                var state = $.extend({}, PG.state);
                state.cond = search;
                state.page.skip = 0;
                PG.pushState(state);
            };
        });
        // 详细条件查询
        $('#detailSearchBtn').click(function(e){
            var search = $('#detail-search-form').getdata({skipEmpty : true});
            var state = $.extend({}, PG.state);
            state.cond = search;
            state.page.skip = 0;
            PG.pushState(state);
        });
                
        $('#typeQueryBtn').click(function(){
            var cond = $("#highlight-form").getdata();
            Module._querycell(cond, Module.showPageHander(cond.type));
        });

        $('.pagebar').on('click','ul.pagination a', function(e){
            e.preventDefault();
            var $a = $(e.target);
            var tgt = $a.attr('href'),
                params = $.deparam(tgt.replace(/^#/,''));
            var state = $.extend({}, PG.state),
                limit = state.page.limit
                state.page.skip = params.skipto * limit;
            
            PG.pushState(state);
        });

        $('#enableEditBtn').click(function(e){
            e.preventDefault();
            var state = $.extend({}, PG.state);
            state.editing = state.editing === 'true' ? 'false' : 'true' ;
            PG.pushState(state);
        });

        $('#cellTable').on('click', 'a.action-edit', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            Module.updateModule(_id);
        });
        $('#cellTable').on('click', 'a.action-advertis', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            Module.updateAdvertis(_id);
        });
        $('#cellTable').on('click', 'a.action-remove', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            Module.deleteModule(_id);
        });
        $('#cellTable').on('click', 'a.action-undoremove', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            Module.unDeleteModule(_id);
        });
        $('#cellTable').on('click', 'a.sortlink', $M.createSortHander(PG));
        $('label[data-toggle]').popover();
        $('div.tag-pool').on('click', 'span.tag', function(e){
            e.preventDefault();
            var $tgt = $(e.target).closest('span.tag'),
                $pool = $tgt.closest('div.tag-pool');
            if($pool.data('select') === 'single'){
                $pool.find('span.tag').removeClass('label-info');
            }
            if($tgt.hasClass('label-info')){
                $tgt.removeClass('label-info');
            }else{
                $tgt.addClass('label-info');
            }
        });
        $(':checkbox[data-touch]').change(function(e){
            console.log(e);
            var $tgt = $(e.target),
                touch = $tgt.data('touch'),
                $touch = $('input[name=' + touch + ']');
            if(!$tgt.prop('checked'))
                return;

            if(!$touch.val()){
                var date = new Date().toISOString().replace(/T.*Z/, '');
                $touch.val(date);
            }

            if( ($tgt.attr('name') === 'active') && $tgt.prop('checked') ){
                $('input[name=activeTime]').val(new Date().toISOString());   
            }


        });
    },
        
    //====================================================================================================================
    // 事件处理函数
    //====================================================================================================================
    // 删除paintings
    deleteModule: function(_id, options){
        $.showmodal('#deleteDlg', function(){
            if ($('#module-delete-form').validate().form()){
                // save change
                var data = $('#module-delete-form').getdata({checkboxAsBoolean : true});
                $M.dodelete('/paintings/delete'
                , { _id : _id , data : data}
                , { successfn : function(){
                        $('#deleteDlg').modal('hide');
                        Module.loadPageData(PG.state.cond, PG.state.page);
                    }});
            }
        });
    },

    // 恢复被删除的paintings
    unDeleteModule: function(_id, options){
        $.ask('删除确认','是否确定恢复被删除的图片？', function(){
            var data = {
                deleted : false,
                active : true
            };
            Module._updateModule(
                { _id : _id , data : data}, 
                function(){
                    Module.loadPageData(PG.state.cond, PG.state.page);
                });
        });
    },

    // 编辑作品信息
    updateModule: function(_id, options){

        $('#module-form').clearall();
        Module._loadDataDetail(_id, function(module){
            var data = module.doc;
            $('#module-form').clearall().autofill(data, {checkboxAsBoolean : true});
            $('#module-form').find('span[data-value]').removeClass('label-info');  

            $('#module-form').find('div.tag-pool').each(function(i, pool){
                var $pool = $(pool),
                    target = $pool.data('target');

                var values = data[target];
                if(!values) return;

                if( typeof(values) === 'string' ){
                    values = [values];
                };
                $.each(values, function(idx, value){
                    $pool.find('span[data-value='+ value +']').addClass('label-info');    
                })
            });  
        });

        $.showmodal('#moduleDlg', function(){
            if ($('#module-form').validate().form()){
                // save change
                var data = $('#module-form').getdata({checkboxAsBoolean : true});

                // 读取tagpool
                var err = [];
                $('#module-form').find('div.tag-pool').each(function(i, pool){
                    var $pool = $(pool),
                        target = $pool.data('target'),
                        required = $pool.data('required') ,
                        isSingle = ($pool.data('type') === 'single');

                    var values = $.map($pool.find('span.tag.label-info'),function(tag, i){ 
                                return $(tag).data('value');
                            });
                    if(isSingle){
                        data[target] = values.length > 0 ? values[0] : null;
                    }else{
                        data[target] = values;
                    };
                    if(required && ( !data[target] || data[target].length === 0))
                        err.push({ target : target, pool : $pool } );
                });

                if(err.length > 0){
                    $.alert("div.tag-pool", '这个字段需要至少选择一个内容', 10000);
                    return;
                }

                data.utime = new Date();
                Module._updateModule($.param({ 
                    _id: _id,
                    data: data 
                }), function(result){
                    $('#moduleDlg').modal('hide');
                    Module.loadPageData(PG.state.cond, PG.state.page);
                },
                function(err){
                    $.alert('#moduleDlg .modal-body', err, 10000);
                });
            }
        });
    },

    updateAdvertis : function(_id){
        $('#module-form-adv').clearall();
        Module._loadDataDetail(_id, function(module){
            var data = module.doc;
            $('#module-form-adv').clearall().autofill(data, {checkboxAsBoolean : true});
            $('#module-form-adv').find('span[data-value]').removeClass('label-info');  

            $('#module-form-adv').find('div.tag-pool').each(function(i, pool){
                var $pool = $(pool),
                    target = $pool.data('target');

                var values = data[target];
                if(!values) return;

                if( typeof(values) === 'string' ){
                    values = [values];
                };
                $.each(values, function(idx, value){
                    $pool.find('span[data-value='+ value +']').addClass('label-info');    
                })
            });  
        });

        $.showmodal('#advModuleDlg', function(){
            if ($('#module-form-adv').validate().form()){
                // save change
                var data = $('#module-form-adv').getdata({checkboxAsBoolean : true});
                data.utime = new Date();
                Module._updateModule($.param({ 
                    _id: _id,
                    data: data 
                }), function(result){
                    $('#advModuleDlg').modal('hide');
                    Module.loadPageData(PG.state.cond, PG.state.page);
                },
                function(err){
                    $.alert('#advModuleDlg .modal-body', err, 10000);
                });
            }
        });
    },
    
    //处理导入数据
    onImportFile : function(){
        $.showmodal('#importDlg', function(dlg){
            var idlist = $('#idListArea').val().split(',');
            $('#importDlg').spin();
            Module.importPaintings(idlist, function(data){
                $.alert('#content-body', '成功导入资源 [' + data.count + "] 条");   
                dlg.modal('hide');
            }, function(errmsg){
                $.alert('#importDlg div.modal-body', '导入资源数据出错:' + errmsg);
                dlg.modal('hide');
            });
            return false;
        });
    },

    //导出当前的查询结果
    importPaintings : function(idlist, fn){
        $M.doupdate('/paintings/import'
            , { idlist: idlist } 
            , { successfn : function(data){
                fn(data);
            } , alertPosition : '#cellDiv' });
    },

    //-----------------------------------------------------
    

    // ========================================================================
    //      功能函数 
    // ========================================================================
    // 更新楼宇信息
    _updateModule : function(condition, fn, fail){
        $M.doupdate('/paintings/update', condition, { successfn : fn , failfn: fail});
    },

    // 查询楼宇详细信息
    _loadDataDetail : function(_id, fn){
        $M.doquery('/paintings/retrive', {_id : _id}
            , { successfn : fn ,
                alertPosition : '#buildingNavtab'});
    },

    // 根据查询条件和分页条件载入数据页面
    listPage : function(type, cond, sort, page, fn, fail){
        $M.doquery('/paintings/list'
            , { type: type, cond : cond, page: page, sort : sort} 
            , { successfn : fn , failfn : fail , alertPosition : '#cellDiv' });
    },

    showPagebar : function(type, cond, page, fn){
        $M.doquery('/paintings/count'
            , { type: type, cond: cond }
            , { successfn : function(module){
                var pagebarHtml = renderPagebar("pagebarTpl", module.count, page);
                fn(pagebarHtml);
            }});
    }
    // ========== 请尽量在这一行后面加入扩展代码 ==========

});

function init(){
    Module.bind();
    PG.bind();
    $('label[data-toggle=popover]').popover();
    $(window).trigger('hashchange');
};

$(document).ready(init);