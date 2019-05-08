var KQLSelector;
(function (KQLSelector) {
    var KqlSelector = /** @class */ (function () {
        function KqlSelector(id) {
        }
        Object.defineProperty(KqlSelector.prototype, "code", {
            get: function () {
                var kqlcode = this.expression.getCode();
                var code = kqlcode.code;
                code = (kqlcode.hasBase ? "n:b" : "n") + "=>" + code;
                return code;
            },
            set: function (value) {
                this._code = value;
            },
            enumerable: true,
            configurable: true
        });
        KqlSelector.prototype.addQuery = function () {
            var query = new KQLSelector.Query();
            //  this.expressionMap[query.id] = query;
            if (this.expression === null) {
                this.expression = query;
            }
            else {
                this.expression = new KQLSelector.Group(this.expression, query);
            }
            this.queryList.push(query);
        };
        KqlSelector.prototype.insertQuery = function (query) {
            var new_query = new KQLSelector.Query();
            // this.expressionMap[query.id] = query;
            //this.expressionMap[group.id] = group;
            if (this.queryList.length == 1) {
                this.expression = new KQLSelector.Group(query, this.expression);
            }
            else {
                query.parent.left = new KQLSelector.Group(query.parent.left, new_query);
            }
            if (query != null) {
                var idx = this.queryList.indexOf(query);
                this.queryList.splice(idx, 0, new_query);
            }
        };
        KqlSelector.prototype.removeQuery = function (query) {
            var idx = this.queryList.indexOf(query);
            this.queryList.splice(idx, 1);
            if (query.parent) {
                var parent = query.parent;
                query.parent = parent.parent;
                var baseParent = parent.parent;
                if (query == parent.left)
                    parent = parent.right;
                else
                    parent = parent.left;
            }
            else {
                this.expression = null;
            }
        };
        KqlSelector.prototype.canMerge = function (queries) {
            for (var i = 0; i < queries.length - 1; i++) {
                if (queries[i].parent.right != queries[i++])
                    return false;
            }
            return true;
        };
        KqlSelector.prototype.merge = function (queries) {
            if (this.canMerge(queries)) {
                var start = queries[0];
                var end = queries[queries.length - 1];
                var right = start.parent.left;
                if (start.parent != end.parent && right != start) {
                    start.parent.parent.merge(start, start.parent.parent.left);
                    end.parent = new KQLSelector.Group(right, end.parent);
                }
                // var group =new  Group();
                // (end.parent as Group).left =(start.parent as Group).left; 
                // start.parent=start;
                // (end.parent as Group).right = new Group((end.parent as Group).left,end)
                // group.left= start;
                // group.right = end.parent;
                // (end.parent as Group) .right =group; 
            }
        };
        return KqlSelector;
    }());
    KQLSelector.KqlSelector = KqlSelector;
})(KQLSelector || (KQLSelector = {}));
//# sourceMappingURL=kqlselector.js.map