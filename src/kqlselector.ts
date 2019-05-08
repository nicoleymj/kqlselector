

namespace KQLSelector {


    export class KqlSelector {
        root: Group;
        expressionMap: { [key: string]: IExpression; } = {};
        mergeMap: { [key: string]: Merge; } = {};
        queryList: Query[] = [];
        sourceData: SourceData;
        public get groupList(): Group[] {
            var groups = this.root.groupList;
            groups.shift();
            return groups;
        }
        public get code(): string {
            if (this.root.expressions.length == 0)
                return "n";
            var kqlcode = this.root.getCode();
            var code = kqlcode.code;
            code = (kqlcode.hasBase ? "n:b" : "n") + "=>" + code;
            return code;
        }

        constructor(id: string, properties: string[]) {
            this.root = new Group();
            this.InitSource(properties);

            this.elementUiInit(id);
        }

        private elementUiInit(id: string) {
            //#region 
            var el = document.getElementById(id);
            if (el.innerHTML.length > 0)
                return;
            el.innerHTML = `  <div class="selector-container">
            <el-row>
              <el-button type="primary" @click="changeView">ChangeView</el-button>
            </el-row>
      
            <el-row v-if="showCode" class="mt24">
              <el-input type="textarea" v-model="code" placeholder="请输入检索条件" :autosize="{ minRows: 2, maxRows: 6 }"
                size="small">
              </el-input>
            </el-row>
      
            <el-row v-else class="mt24">
              <div class="selector-wrapper">
                <el-table size="mini" :data="ks.queryList" style="width: 100%" :span-method="arraySpanMethod">
                  <!--insert-->
                  <el-table-column width="50" align="center">
                    <template slot-scope="scope">
                      <i class="el-icon-add" @click="insertQuery(scope.row, scope.$index)"></i>
                    </template>
                  </el-table-column>
                  <!--remove-->
                  <el-table-column width="50" align="center">
                    <template slot-scope="scope">
                      <i class="el-icon-del" @click="removeQuery(scope.row)"></i>
                    </template>
                  </el-table-column>
                  <!--check merge-->
                  <el-table-column width="50" align="center">
                    <template slot="header" slot-scope="scope">
                      <i class="el-icon-merge" @click="merge" :class="{'merge-disabled': !canMerge}"></i>
                    </template>
                    <template slot-scope="scope">
                      <el-checkbox v-model="scope.row.checked"></el-checkbox>
                    </template>
                  </el-table-column>
      
                  <!--merge 括号-->
                  <el-table-column width="32" v-for="(item, index) in maxMerge" :key="index" class-name="noPadding"
                    align="center">
                    <template slot-scope="scope">
                      <span v-if="scope.row.mergeList.length > 0" class="inline-block"
                        :class="mergeClass(scope.row.mergeList, index)">
                        <i v-if="scope.row.mergeList.length > 0&& scope.row.mergeList.length>maxMerge-index-1 && scope.row.mergeList[maxMerge-index-1].mergeType === 0"
                          class="el-icon-unmerge"
                          @click="unmerge(scope.row.mergeList[scope.row.mergeList.length-index-1])"></i>
                      </span>
                    </template>
                  </el-table-column>
      
                  <!--merge 逻辑运算符-->
                  <el-table-column width="90" label="Merge">
                    <template slot-scope="scope">
                      <span v-if="scope.row.logicOper !== undefined">
                        <el-select v-model="scope.row.logicOper" placeholder="请选择" size="small">
                          <el-option v-for="(key, value) in ks.sourceData.logicOpers" :key="key" :label="key" :value="value">
                          </el-option>
                        </el-select>
                      </span>
                    </template>
                  </el-table-column>
                  <!--Node-->
                  <el-table-column width="160" label="Node">
                    <template slot-scope="scope">
                      <span>
                        <el-select v-model="scope.row.nodeType" placeholder="请选择" size="small">
                          <el-option v-for="(key, value) in ks.sourceData.nodeTypes" :key="key" :label="key" :value="value">
                          </el-option>
                        </el-select>
                      </span>
                    </template>
                  </el-table-column>
                  <!--nodeKey-->
                  <el-table-column width="160" label="Key">
                    <template slot-scope="scope">
                      <span>
                        <el-select v-model="scope.row.nodeKey" placeholder="请选择" size="small">
                          <el-option v-for="(key, value) in ks.sourceData.nodeKeys" :key="key" :label="key" :value="value">
                          </el-option>
                        </el-select>
                      </span>
                    </template>
                  </el-table-column>
                  <!--nodePropertyKey-->
                  <el-table-column width="160" label="Properties">
                    <template slot-scope="scope">
                      <span>
                        <el-select v-model="scope.row.nodePropertyKey" :disabled="scope.row.nodeKey != 'Property'" placeholder="请选择"
                          size="small">
                          <el-option v-for="(key, value) in ks.sourceData.nodePropertyKeys" :key="key" :label="key"
                            :value="value">
                          </el-option>
                        </el-select>
                      </span>
                    </template>
                  </el-table-column>
                  <!--Operator-->
                  <el-table-column width="160" label="Operator">
                    <template slot-scope="scope">
                      <span>
                        <el-select v-model="scope.row.filterOper" placeholder="请选择" size="small">
                          <el-option v-for="(key, value) in ks.sourceData.filterOpers" :key="key" :label="key" :value="value">
                          </el-option>
                        </el-select>
                      </span>
                    </template>
                  </el-table-column>
      
                  <!--Value-->
                  <el-table-column width="160" label="Value">
                    <template slot-scope="scope">
                      <span>
                        <el-input v-model="scope.row.value" size="small"></el-input>
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-row>
            <el-row class="mt24">
              <el-button plain icon="el-icon-add" @click="addQuery" class="add-query-btn">Add new clause</el-button>
            </el-row>
          </div>`;
            //#endregion
            var ks = this;
            var Main = {
                data() {
                  return {
                    code: '',
                    showCode: false,
                    ks: ks,
                  }
                },
                computed: {
                  maxMerge() {
                    let max = 0
                    this.ks.queryList.forEach(item => {
                      if (item.mergeList.length > max) {
                        max = item.mergeList.length
                      }
                    })
                    return max
                  },
                  canMerge() {
                    const queries = this.getChecked()
                    if (queries.length > 1) {
                      return this.ks.canMerge(queries)
                    }
                    return false
                  }
                },
                mounted() {
                  this.ks.addQuery()   
                  console.log(this.ks)
                },
                methods: {
                    arraySpanMethod({ row, column, rowIndex, columnIndex }) {
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
            
                  mergeClass(mergeList, index) {
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
                  changeView() {
                    this.code = this.ks.code
                    this.showCode = !this.showCode
                    console.log(this.ks)
                  },
                  addQuery() {
                    this.ks.addQuery()      
                  },
                  insertQuery(queryObj, index) {
                    this.ks.insertQuery(queryObj)
                    console.log(this.ks)
                  },
                  removeQuery(queryObj) {
                    this.ks.removeQuery(queryObj)
                    console.log(this.ks)
                  },
                  getChecked() {
                    const queries = this.ks.queryList.filter(item => item.checked)
                    return queries
                  },
                  merge() {
                    if (this.canMerge) {
                      const queries = this.getChecked()
                      this.ks.merge(queries)
                      this.ks.queryList.forEach(item => {
                        if (item.checked) {
                          Vue.set(item, 'checked', false)
                        }
                      })
                    }
                  },
                  unmerge(mergeObj) {
                    this.ks.unMerge(mergeObj)
                  }
                }
              }
              var Ctor = Vue.extend(Main)
              new Ctor().$mount('#' + id)


        }

        private InitSource(properties: string[]) {
            this.sourceData = new SourceData();

            if (properties)
                properties.forEach(p => {
                    this.sourceData.nodePropertyKeys[p] = p;
                });
        }

        addQuery() {
            var query = new Query(this.root, this.root.expressions.length == 0);
            this.root.expressions.push(query);
            this.queryList.push(query);
            this.expressionMap[query.id] = query;

            this.updateQueryMergeList();
        }
        insertQuery(query: Query) {

            var parent = query.parent;
            var new_query;
            if (this.queryList[0] == query) {
                new_query = new Query(parent, true);
                query.logicOper = "&&";
            }
            else
                new_query = new Query(parent, false);

            var pidx = parent.expressions.indexOf(query);
            parent.expressions.splice(pidx, 0, new_query);

            var idx = this.queryList.indexOf(query);
            this.queryList.splice(idx, 0, new_query);

            this.updateQueryMergeList();

        }
        removeQuery(query: Query) {

            var parent = query.parent;
            var pidx = parent.expressions.indexOf(query);
            parent.expressions.splice(pidx, 1);
            if (parent.expressions.length == 1) {
                var base = parent.parent as Group;
                var expressions = base.expressions;
                var idx = expressions.indexOf(parent);

                expressions.splice(idx, 1);
                parent.expressions[0].parent = base;
                expressions.splice(idx, 0, parent.expressions[0]);
            }


            var idx = this.queryList.indexOf(query);
            this.queryList.splice(idx, 1);

            this.updateQueryMergeList();
        }

        canMerge(queries: Query[]): boolean {
            var expressions = this.getExpressions(queries);
            return this._canMerge(expressions);
        }
        private _canMerge(expressions: IExpression[]): boolean {
            if (expressions.length == 1)
                return false;
            var parent = expressions[0].parent as Group;
            var idx = parent.expressions.indexOf(expressions[0]);
            return expressions.every((exp, i) =>
                i < parent.expressions.length && exp == parent.expressions[i + idx]);
        }
        private getExpressions(queries: Query[]): IExpression[] {
            var expressions: IExpression[] = [];
            expressions.push(...queries);
            this.groupList.forEach((group: Group) => {
                var group_queryies = group.queryies;
                if (group_queryies.every((q, i) => expressions.some(eq => eq == q))) {
                    //   queries.splice(queries.indexOf(group_queryies[0]), group_queryies.length);     

                    var idx = expressions.indexOf(group_queryies[0]);
                    expressions.splice(idx, group_queryies.length);
                    expressions.splice(idx, 0, group);
                }
            });
            return expressions;
        }

        unMerge(merge: Merge) {
            var expressions = merge.group.expressions;
            var queries = merge.group.queryies;
            var parent = merge.group.parent as Group;
            expressions.forEach(exp => exp.parent = parent);
            var pidx = parent.expressions.indexOf(merge.group);
            parent.expressions.splice(pidx, 1);
            parent.expressions.splice(pidx, 0, ...expressions);

            this.updateQueryMergeList();

        }
        merge(queries: Query[]) {
            var expressions = this.getExpressions(queries);
            if (!this._canMerge(expressions))
                return;
            //new_group.expressions   
            var new_group = new Group();
            new_group.expressions = expressions;

            //insert to position
            var parent = expressions[0].parent as Group;
            new_group.parent = parent;
            var pidx = parent.expressions.indexOf(expressions[0]);
            parent.expressions.splice(pidx, expressions.length);
            parent.expressions.splice(pidx, 0, new_group);

            //change parent to new group
            expressions.forEach(exp => exp.parent = new_group);

            this.updateQueryMergeList();
        }
        private updateQueryMergeList() {
            this.queryList.forEach((q) => {

                q.mergeList = [];
                var group = q.parent;
                while (group != this.root) {
                    var merge = new Merge(group);
                    var i = group.queryies.indexOf(q);
                    if (i == 0)
                        merge.mergeType = MergeType.start
                    else if (i == group.queryies.length - 1)
                        merge.mergeType = MergeType.end;
                    else
                        merge.mergeType = MergeType.center;
                    q.mergeList.push(merge);
                    group = group.parent as Group;
                }

                for (var i = q.mergeList.length - 1; i >= 0; i -= q.mergeList[i].span) {
                    if (i == 0)
                        q.mergeList[i].span = q.mergeList[i].group.depth;
                    else
                        q.mergeList[i].span = q.mergeList[i].group.depth - q.mergeList[i - 1].group.depth;
                    var emptyarr: Merge[] = new Array(q.mergeList[i].span - 1);
                    q.mergeList.splice(i + 1, 0, ...emptyarr);
                }
            });
        }
    }
}

