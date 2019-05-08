var KQLSelector;
(function (KQLSelector) {
    var NodeType;
    (function (NodeType) {
        NodeType[NodeType["this"] = 0] = "this";
        NodeType[NodeType["base"] = 1] = "base";
    })(NodeType = KQLSelector.NodeType || (KQLSelector.NodeType = {}));
    var NodeKey;
    (function (NodeKey) {
        NodeKey[NodeKey["Id"] = 0] = "Id";
        NodeKey[NodeKey["NodeName"] = 1] = "NodeName";
        NodeKey[NodeKey["Property"] = 2] = "Property";
    })(NodeKey = KQLSelector.NodeKey || (KQLSelector.NodeKey = {}));
    var FilterOper;
    (function (FilterOper) {
        FilterOper[FilterOper["=="] = 0] = "==";
        FilterOper[FilterOper["!="] = 1] = "!=";
        FilterOper[FilterOper[">"] = 2] = ">";
        FilterOper[FilterOper[">="] = 3] = ">=";
        FilterOper[FilterOper["<"] = 4] = "<";
        FilterOper[FilterOper["<="] = 5] = "<=";
    })(FilterOper = KQLSelector.FilterOper || (KQLSelector.FilterOper = {}));
    var MergeOper;
    (function (MergeOper) {
        MergeOper[MergeOper["&&"] = 0] = "&&";
        MergeOper[MergeOper["||"] = 1] = "||";
    })(MergeOper = KQLSelector.MergeOper || (KQLSelector.MergeOper = {}));
    var SourceData = /** @class */ (function () {
        function SourceData() {
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
        function Query() {
            this.id = "query_" + Query.num++;
        }
        Query.prototype.getCode = function () {
            var kqlcode = new KqlCode();
            kqlcode.code = "";
            if (this.nodeType == NodeType.this) {
                kqlcode.code = "n";
                kqlcode.hasBase = false;
            }
            else {
                kqlcode.code = "b";
                kqlcode.hasBase = true;
            }
            var pk = this.nodePropertyKey.replace(/\"/g, "\\\"");
            if (this.nodeKey == NodeKey.Property)
                kqlcode.code += "[\"" + pk + "\"]";
            else
                kqlcode.code += "." + NodeKey[this.nodeKey];
            kqlcode.code += FilterOper[this.filterOper];
            if (typeof this.value == "number")
                kqlcode.code += this.value;
            else
                kqlcode.code += "\"" + this.value.replace(/\"/g, "\\\"") + "\"";
            return kqlcode;
        };
        return Query;
    }());
    KQLSelector.Query = Query;
    var Group = /** @class */ (function () {
        function Group(left, right) {
            if (left === void 0) { left = null; }
            if (right === void 0) { right = null; }
            this.id = "group_" + Query.num++;
            if (left != null && right != null) {
                this.merge(left, right);
            }
        }
        Group.prototype.getCode = function () {
            var kqlcode = new KqlCode();
            var leftcode = this.left.getCode();
            var rightcode = this.right.getCode();
            kqlcode.code = "(" + leftcode.code + ") " + MergeOper[this.mergeOper] + " (" + rightcode.code + ")";
            kqlcode.hasBase = leftcode.hasBase || rightcode.hasBase;
            return kqlcode;
        };
        Group.prototype.merge = function (left, right) {
            left.parent = this;
            right.parent = this;
            this.left = left;
            this.right = right;
        };
        return Group;
    }());
    KQLSelector.Group = Group;
})(KQLSelector || (KQLSelector = {}));
//# sourceMappingURL=KqlModel.js.map