namespace KQLSelector {
    export enum MergeType {
        start,
        center,
        end
    }

    export class SourceData {
        nodeTypes: { [key: string]: string; } = {
            'this': 'this',
            'base': 'base'
        };
        nodeKeys: { [key: string]: string; } = {
            'Id': 'Id',
            'NodeName': 'NodeName',
            'Property': 'Property',
            'RelationName': 'RelationName'
        };
        nodePropertyKeys: { [key: string]: string; } = {};

        filterOpers: { [key: string]: string; } = {
            '==': 'Equal',
            '<>': 'NotEqual',
            '>': 'Greater',
            '>=': 'GreaterOrEqual',
            '<': 'Less',
            '<=': 'LessOrEqual'
        };
        logicOpers: { [key: string]: string; } = {
            '&&': 'And',
            '||': 'Or',
        };

    }

    export class KqlCode {
        hasBase: boolean;
        lastLogicOper: string;
        code: string;
    }
    export class Query implements IExpression {

        public get queryies(): Query[] {
            return [this];
        }
        static num: number = 0;
        id: string;
        parent: Group;
        logicOper: string;
        nodeType: string = 'this';
        nodeKey: string = 'NodeName';
        nodePropertyKey: string = "";
        filterOper: string = "==";
        value: string = "";
        mergeList: Merge[] = [];

        checked: boolean = false;
        //  isFirstQuery: boolean;
        constructor(parent: Group, isFirst: boolean = false) {
            this.id = "query_" + Query.num++;
            this.parent = parent;
            //  this.isFirstQuery = isFirst;
            if (!isFirst)
                this.logicOper = "&&";
        }
        getCode(): KqlCode {
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
        }

    }
    export class Group implements IExpression {
        static num: number = 0;
        id: string;
        parent: IExpression;
        expressions: IExpression[] = [];
        public get depth(): number {
            var max = 0;
            this.expressions.forEach(exp => {
                var depth = 0;
                if (exp instanceof Query)
                    depth = 1;
                else if (exp instanceof Group)
                    depth = exp.depth + 1;
                if (max < depth)
                    max = depth;
            });
            return max;
        }
        getCode(): KqlCode {
            var kqlcode = new KqlCode();
            kqlcode.code = "";

            this.expressions.forEach((exp, i) => {
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
        }
        constructor() {
            this.id = "group_" + Group.num++
        }
        public get queryies(): Query[] {
            var queryList: Query[] = [];
            this.expressions.forEach(exp => {
                queryList.push(...exp.queryies);
            });
            return queryList;
        }
        public get groupList(): Group[] {
            var groups: Group[] = [this];
            this.expressions.forEach(exp => {
                if (exp instanceof Group)
                    groups.push(...exp.groupList);
            })
            return groups;
        }
    }


    export class Merge {
        mergeType: MergeType;
        group: Group;
        mergeId: string;
        span: number;

        constructor(group: Group) {
            this.group = group;
            this.mergeId = group.id;
        }
    }
}