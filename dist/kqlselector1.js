var KQLSelector;
(function (KQLSelector) {
    var MergeType;
    (function (MergeType) {
        MergeType[MergeType["start"] = 0] = "start";
        MergeType[MergeType["center"] = 1] = "center";
        MergeType[MergeType["end"] = 2] = "end";
    })(MergeType = KQLSelector.MergeType || (KQLSelector.MergeType = {}));
    var SourceData = /** @class */ (function () {
        function SourceData() {
            this.nodeTypes = {
                'this': 'this',
                'base': 'base'
            };
            this.nodeKeys = {
                'Id': 'Id',
                'NodeName': 'NodeName',
                'Property': 'Property',
                'RelationName': 'RelationName'
            };
            this.nodePropertyKeys = {};
            this.filterOpers = {
                '==': 'Equal',
                '<>': 'NotEqual',
                '>': 'Greater',
                '>=': 'GreaterOrEqual',
                '<': 'Less',
                '<=': 'LessOrEqual'
            };
            this.logicOpers = {
                '&&': 'And',
                '||': 'Or',
            };
        }
        return SourceData;
    }());
    KQLSelector.SourceData = SourceData;
    var KqlCode = /** @class */ (function () {
        function KqlCode() {
        }
        return KqlCode;
    }());
    KQLSelector.KqlCode = KqlCode;
    var Query = /** @class */ (function () {
        //  isFirstQuery: boolean;
        function Query(parent, isFirst) {
            if (isFirst === void 0) { isFirst = false; }
            this.nodeType = 'this';
            this.nodeKey = 'NodeName';
            this.nodePropertyKey = "";
            this.filterOper = "==";
            this.value = "";
            this.mergeList = [];
            this.checked = false;
            this.id = "query_" + Query.num++;
            this.parent = parent;
            //  this.isFirstQuery = isFirst;
            if (!isFirst)
                this.logicOper = "&&";
        }
        Object.defineProperty(Query.prototype, "queryies", {
            get: function () {
                return [this];
            },
            enumerable: true,
            configurable: true
        });
        Query.prototype.getCode = function () {
            var kqlcode = new KqlCode();
            kqlcode.code = "";
            if (this.nodeType == 'this') {
                kqlcode.code = "n";
                kqlcode.hasBase = false;
            }
            else {
                kqlcode.code = "b";
                kqlcode.hasBase = true;
            }
            var pk = this.nodePropertyKey.replace(/\"/g, "\\\"");
            if (this.nodeKey == 'Property')
                kqlcode.code += "[\"" + pk + "\"]";
            else
                kqlcode.code += "." + this.nodeKey;
            kqlcode.code += this.filterOper;
            if (this.value.length > 0 && !isNaN(Number(this.value)))
                kqlcode.code += this.value;
            else
                kqlcode.code += "\"" + this.value.replace(/\"/g, "\\\"") + "\"";
            if (this.logicOper !== undefined)
                kqlcode.lastLogicOper = this.logicOper;
            return kqlcode;
        };
        Query.num = 0;
        return Query;
    }());
    KQLSelector.Query = Query;
    var Group = /** @class */ (function () {
        function Group() {
            this.expressions = [];
            this.id = "group_" + Group.num++;
        }
        Object.defineProperty(Group.prototype, "depth", {
            get: function () {
                var max = 0;
                this.expressions.forEach(function (exp) {
                    var depth = 0;
                    if (exp instanceof Query)
                        depth = 1;
                    else if (exp instanceof Group)
                        depth = exp.depth + 1;
                    if (max < depth)
                        max = depth;
                });
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Group.prototype.getCode = function () {
            var kqlcode = new KqlCode();
            kqlcode.code = "";
            this.expressions.forEach(function (exp, i) {
                var e_code = exp.getCode();
                if (i == 0)
                    kqlcode.lastLogicOper = e_code.lastLogicOper;
                if (e_code.hasBase)
                    kqlcode.hasBase = true;
                if (exp instanceof Query)
                    kqlcode.code += (i != 0 ? e_code.lastLogicOper : "") + " " + e_code.code + " ";
                else
                    kqlcode.code += (e_code.lastLogicOper !== undefined ? e_code.lastLogicOper : "") + " (" + e_code.code + ") ";
            });
            return kqlcode;
        };
        Object.defineProperty(Group.prototype, "queryies", {
            get: function () {
                var queryList = [];
                this.expressions.forEach(function (exp) {
                    queryList.push.apply(queryList, exp.queryies);
                });
                return queryList;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group.prototype, "groupList", {
            get: function () {
                var groups = [this];
                this.expressions.forEach(function (exp) {
                    if (exp instanceof Group)
                        groups.push.apply(groups, exp.groupList);
                });
                return groups;
            },
            enumerable: true,
            configurable: true
        });
        Group.num = 0;
        return Group;
    }());
    KQLSelector.Group = Group;
    var Merge = /** @class */ (function () {
        function Merge(group) {
            this.group = group;
            this.mergeId = group.id;
        }
        return Merge;
    }());
    KQLSelector.Merge = Merge;
})(KQLSelector || (KQLSelector = {}));
var KQLSelector;
(function (KQLSelector) {
    var KqlSelector = /** @class */ (function () {
        function KqlSelector(id, properties) {
            this.expressionMap = {};
            this.mergeMap = {};
            this.queryList = [];
            this.root = new KQLSelector.Group();
            this.InitSource(properties);
            this.elementUiInit(id);
        }
        Object.defineProperty(KqlSelector.prototype, "groupList", {
            get: function () {
                var groups = this.root.groupList;
                groups.shift();
                return groups;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KqlSelector.prototype, "code", {
            get: function () {
                if (this.root.expressions.length == 0)
                    return "n";
                var kqlcode = this.root.getCode();
                var code = kqlcode.code;
                code = (kqlcode.hasBase ? "n:b" : "n") + "=>" + code;
                return code;
            },
            enumerable: true,
            configurable: true
        });
        KqlSelector.prototype.elementUiInit = function (id) {
            //#region 
            var el = document.getElementById(id);
            if (el.innerHTML.length > 0)
                return;
            el.innerHTML = "  <div class=\"selector-container\">\n            <el-row>\n              <el-button type=\"primary\" @click=\"changeView\">ChangeView</el-button>\n            </el-row>\n      \n            <el-row v-if=\"showCode\" class=\"mt24\">\n              <el-input type=\"textarea\" v-model=\"code\" placeholder=\"\u8BF7\u8F93\u5165\u68C0\u7D22\u6761\u4EF6\" :autosize=\"{ minRows: 2, maxRows: 6 }\"\n                size=\"small\">\n              </el-input>\n            </el-row>\n      \n            <el-row v-else class=\"mt24\">\n              <div class=\"selector-wrapper\">\n                <el-table size=\"mini\" :data=\"ks.queryList\" style=\"width: 100%\" :span-method=\"arraySpanMethod\">\n                  <!--insert-->\n                  <el-table-column width=\"50\" align=\"center\">\n                    <template slot-scope=\"scope\">\n                      <i class=\"el-icon-plus\" @click=\"insertQuery(scope.row, scope.$index)\"></i>\n                    </template>\n                  </el-table-column>\n                  <!--remove-->\n                  <el-table-column width=\"50\" align=\"center\">\n                    <template slot-scope=\"scope\">\n                      <i class=\"el-icon-delete\" @click=\"removeQuery(scope.row)\"></i>\n                    </template>\n                  </el-table-column>\n                  <!--check merge-->\n                  <el-table-column width=\"50\" align=\"center\">\n                    <template slot=\"header\" slot-scope=\"scope\">\n                      <!--<i class=\"el-icon-folder-add\" :disabled=\"!ks.canMerge()\" @click=\"merge\"></i>-->\n                      <i class=\"el-icon-merge\" @click=\"merge\" :class=\"{'not-allowed': !canMerge}\"></i>\n                      <!--<i class=\"el-icon-merge\" @click=\"merge\"></i>-->\n                    </template>\n                    <template slot-scope=\"scope\">\n                      <el-checkbox v-model=\"scope.row.checked\"></el-checkbox>\n                    </template>\n                  </el-table-column>\n      \n                  <!--merge \u62EC\u53F7-->\n                  <el-table-column width=\"40\" v-for=\"(item, index) in maxMerge\" :key=\"index\" class-name=\"noPadding\"\n                    align=\"center\">\n                    <template slot-scope=\"scope\">\n                      <span v-if=\"scope.row.mergeList.length > 0\" class=\"inline-block\"\n                        :class=\"mergeClass(scope.row.mergeList, index)\">\n                        <i v-if=\"scope.row.mergeList.length > 0&& scope.row.mergeList.length>maxMerge-index-1 && scope.row.mergeList[maxMerge-index-1].mergeType === 0\"\n                          class=\"el-icon-unmerge\"\n                          @click=\"unmerge(scope.row.mergeList[scope.row.mergeList.length-index-1])\"></i>\n                      </span>\n                    </template>\n                  </el-table-column>\n      \n                  <!--merge \u903B\u8F91\u8FD0\u7B97\u7B26-->\n                  <el-table-column width=\"160\" label=\"Merge\">\n                    <template slot-scope=\"scope\">\n                      <span v-if=\"scope.row.logicOper !== undefined\">\n                        <el-select v-model=\"scope.row.logicOper\" placeholder=\"\u8BF7\u9009\u62E9\" size=\"small\">\n                          <el-option v-for=\"(key, value) in ks.sourceData.logicOpers\" :key=\"key\" :label=\"key\" :value=\"value\">\n                          </el-option>\n                        </el-select>\n                      </span>\n                    </template>\n                  </el-table-column>\n                  <!--Node-->\n                  <el-table-column width=\"160\" label=\"Node\">\n                    <template slot-scope=\"scope\">\n                      <span>\n                        <el-select v-model=\"scope.row.nodeType\" placeholder=\"\u8BF7\u9009\u62E9\" size=\"small\">\n                          <el-option v-for=\"(key, value) in ks.sourceData.nodeTypes\" :key=\"key\" :label=\"key\" :value=\"value\">\n                          </el-option>\n                        </el-select>\n                      </span>\n                    </template>\n                  </el-table-column>\n                  <!--nodeKey-->\n                  <el-table-column width=\"160\" label=\"Key\">\n                    <template slot-scope=\"scope\">\n                      <span>\n                        <el-select v-model=\"scope.row.nodeKey\" placeholder=\"\u8BF7\u9009\u62E9\" size=\"small\">\n                          <el-option v-for=\"(key, value) in ks.sourceData.nodeKeys\" :key=\"key\" :label=\"key\" :value=\"value\">\n                          </el-option>\n                        </el-select>\n                      </span>\n                    </template>\n                  </el-table-column>\n                  <!--nodePropertyKey-->\n                  <el-table-column width=\"160\" label=\"Properties\">\n                    <template slot-scope=\"scope\">\n                      <span>\n                        <el-select v-model=\"scope.row.nodePropertyKey\" :disabled=\"scope.row.nodeKey != 'Property'\" placeholder=\"\u8BF7\u9009\u62E9\"\n                          size=\"small\">\n                          <el-option v-for=\"(key, value) in ks.sourceData.nodePropertyKeys\" :key=\"key\" :label=\"key\"\n                            :value=\"value\">\n                          </el-option>\n                        </el-select>\n                      </span>\n                    </template>\n                  </el-table-column>\n                  <!--Operator-->\n                  <el-table-column width=\"160\" label=\"Operator\">\n                    <template slot-scope=\"scope\">\n                      <span>\n                        <el-select v-model=\"scope.row.filterOper\" placeholder=\"\u8BF7\u9009\u62E9\" size=\"small\">\n                          <el-option v-for=\"(key, value) in ks.sourceData.filterOpers\" :key=\"key\" :label=\"key\" :value=\"value\">\n                          </el-option>\n                        </el-select>\n                      </span>\n                    </template>\n                  </el-table-column>\n      \n                  <!--Value-->\n                  <el-table-column width=\"160\" label=\"Value\">\n                    <template slot-scope=\"scope\">\n                      <span>\n                        <el-input v-model=\"scope.row.value\" size=\"small\"></el-input>\n                      </span>\n                    </template>\n                  </el-table-column>\n                </el-table>\n              </div>\n            </el-row>\n            <el-row class=\"mt24\">\n              <el-button type=\"primary\" icon=\"el-icon-plus\" @click=\"addQuery\"></el-button>\n            </el-row>\n          </div>";
            //#endregion
            var ks = this;
            var Main = {
                data: function () {
                    return {
                        code: '',
                        showCode: false,
                        ks: ks,
                    };
                },
                computed: {
                    maxMerge: function () {
                        var max = 0;
                        this.ks.queryList.forEach(function (item) {
                            if (item.mergeList.length > max) {
                                max = item.mergeList.length;
                            }
                        });
                        return max;
                    },
                    canMerge: function () {
                        var queries = this.getChecked();
                        if (queries.length > 1) {
                            return this.ks.canMerge(queries);
                        }
                        return false;
                    }
                },
                mounted: function () {
                    this.ks.addQuery();
                    console.log(this.ks);
                },
                methods: {
                    arraySpanMethod: function (_a) {
                        var row = _a.row, column = _a.column, rowIndex = _a.rowIndex, columnIndex = _a.columnIndex;
                        var index = columnIndex - 3;
                        if (row.mergeList.length > 0 && index >= 0 && index < this.maxMerge) {
                            var merge = row.mergeList[this.maxMerge - index - 1];
                            if (merge)
                                return [1, merge.span];
                            else if (this.maxMerge - index - 1 < row.mergeList.length)
                                return [1, 0];
                            else
                                return [1, 1];
                        }
                        else
                            return [1, 1];
                    },
                    mergeClass: function (mergeList, index) {
                        var merge = mergeList[this.maxMerge - index - 1];
                        if (merge) {
                            var color = 'mergeColor_' + (merge.group.depth % 4);
                            switch (merge.mergeType) {
                                case 0: return color + ' merge-border-left-top';
                                case 1: return color + ' merge-border-left';
                                case 2: return color + ' merge-border-left-bottom';
                            }
                        }
                        else
                            return '';
                    },
                    changeView: function () {
                        this.code = this.ks.code;
                        this.showCode = !this.showCode;
                        console.log(this.ks);
                    },
                    addQuery: function () {
                        this.ks.addQuery();
                    },
                    insertQuery: function (queryObj, index) {
                        this.ks.insertQuery(queryObj);
                        console.log(this.ks);
                    },
                    removeQuery: function (queryObj) {
                        this.ks.removeQuery(queryObj);
                        console.log(this.ks);
                    },
                    getChecked: function () {
                        var queries = this.ks.queryList.filter(function (item) { return item.checked; });
                        return queries;
                    },
                    merge: function () {
                        if (this.canMerge) {
                            var queries = this.getChecked();
                            this.ks.merge(queries);
                            this.ks.queryList.forEach(function (item) {
                                if (item.checked) {
                                    Vue.set(item, 'checked', false);
                                }
                            });
                        }
                    },
                    unmerge: function (mergeObj) {
                        this.ks.unMerge(mergeObj);
                    }
                }
            };
            var Ctor = Vue.extend(Main);
            new Ctor().$mount('#' + id);
        };
        KqlSelector.prototype.InitSource = function (properties) {
            var _this = this;
            this.sourceData = new KQLSelector.SourceData();
            if (properties)
                properties.forEach(function (p) {
                    _this.sourceData.nodePropertyKeys[p] = p;
                });
        };
        KqlSelector.prototype.addQuery = function () {
            var query = new KQLSelector.Query(this.root, this.root.expressions.length == 0);
            this.root.expressions.push(query);
            this.queryList.push(query);
            this.expressionMap[query.id] = query;
            this.updateQueryMergeList();
        };
        KqlSelector.prototype.insertQuery = function (query) {
            var parent = query.parent;
            var new_query;
            if (this.queryList[0] == query) {
                new_query = new KQLSelector.Query(parent, true);
                query.logicOper = "&&";
            }
            else
                new_query = new KQLSelector.Query(parent, false);
            var pidx = parent.expressions.indexOf(query);
            parent.expressions.splice(pidx, 0, new_query);
            var idx = this.queryList.indexOf(query);
            this.queryList.splice(idx, 0, new_query);
            this.updateQueryMergeList();
        };
        KqlSelector.prototype.removeQuery = function (query) {
            var parent = query.parent;
            var pidx = parent.expressions.indexOf(query);
            parent.expressions.splice(pidx, 1);
            if (parent.expressions.length == 1) {
                var base = parent.parent;
                var expressions = base.expressions;
                var idx = expressions.indexOf(parent);
                expressions.splice(idx, 1);
                parent.expressions[0].parent = base;
                expressions.splice(idx, 0, parent.expressions[0]);
            }
            var idx = this.queryList.indexOf(query);
            this.queryList.splice(idx, 1);
            this.updateQueryMergeList();
        };
        KqlSelector.prototype.canMerge = function (queries) {
            var expressions = this.getExpressions(queries);
            return this._canMerge(expressions);
        };
        KqlSelector.prototype._canMerge = function (expressions) {
            if (expressions.length == 1)
                return false;
            var parent = expressions[0].parent;
            var idx = parent.expressions.indexOf(expressions[0]);
            return expressions.every(function (exp, i) {
                return i < parent.expressions.length && exp == parent.expressions[i + idx];
            });
        };
        KqlSelector.prototype.getExpressions = function (queries) {
            var expressions = [];
            expressions.push.apply(expressions, queries);
            this.groupList.forEach(function (group) {
                var group_queryies = group.queryies;
                if (group_queryies.every(function (q, i) { return expressions.some(function (eq) { return eq == q; }); })) {
                    //   queries.splice(queries.indexOf(group_queryies[0]), group_queryies.length);     
                    var idx = expressions.indexOf(group_queryies[0]);
                    expressions.splice(idx, group_queryies.length);
                    expressions.splice(idx, 0, group);
                }
            });
            return expressions;
        };
        KqlSelector.prototype.unMerge = function (merge) {
            var expressions = merge.group.expressions;
            var queries = merge.group.queryies;
            var parent = merge.group.parent;
            expressions.forEach(function (exp) { return exp.parent = parent; });
            var pidx = parent.expressions.indexOf(merge.group);
            parent.expressions.splice(pidx, 1);
            (_a = parent.expressions).splice.apply(_a, [pidx, 0].concat(expressions));
            this.updateQueryMergeList();
            var _a;
        };
        KqlSelector.prototype.merge = function (queries) {
            var expressions = this.getExpressions(queries);
            if (!this._canMerge(expressions))
                return;
            //new_group.expressions   
            var new_group = new KQLSelector.Group();
            new_group.expressions = expressions;
            //insert to position
            var parent = expressions[0].parent;
            new_group.parent = parent;
            var pidx = parent.expressions.indexOf(expressions[0]);
            parent.expressions.splice(pidx, expressions.length);
            parent.expressions.splice(pidx, 0, new_group);
            //change parent to new group
            expressions.forEach(function (exp) { return exp.parent = new_group; });
            this.updateQueryMergeList();
        };
        KqlSelector.prototype.updateQueryMergeList = function () {
            var _this = this;
            this.queryList.forEach(function (q) {
                q.mergeList = [];
                var group = q.parent;
                while (group != _this.root) {
                    var merge = new KQLSelector.Merge(group);
                    var i = group.queryies.indexOf(q);
                    if (i == 0)
                        merge.mergeType = KQLSelector.MergeType.start;
                    else if (i == group.queryies.length - 1)
                        merge.mergeType = KQLSelector.MergeType.end;
                    else
                        merge.mergeType = KQLSelector.MergeType.center;
                    q.mergeList.push(merge);
                    group = group.parent;
                }
                for (var i = q.mergeList.length - 1; i >= 0; i -= q.mergeList[i].span) {
                    if (i == 0)
                        q.mergeList[i].span = q.mergeList[i].group.depth;
                    else
                        q.mergeList[i].span = q.mergeList[i].group.depth - q.mergeList[i - 1].group.depth;
                    var emptyarr = new Array(q.mergeList[i].span - 1);
                    (_a = q.mergeList).splice.apply(_a, [i + 1, 0].concat(emptyarr));
                }
                var _a;
            });
        };
        return KqlSelector;
    }());
    KQLSelector.KqlSelector = KqlSelector;
})(KQLSelector || (KQLSelector = {}));
//# sourceMappingURL=kqlselector.js.map