/// <reference path="./DynamicNodeManager.ts" />


class MonitorNodeManager extends DynamicNodeManager {

	SetMonitorNode(evidenceNode: AssureIt.NodeModel) {
		var location: string = getContextNode(evidenceNode.Parent).Notes["Location"];
		var condition: string = getContextNode(evidenceNode.Parent).Notes["Monitor"];
		var item: string = extractItemFromCondition(condition);
		var monitorNode: MonitorNode = <MonitorNode>this.DynamicNodeMap[evidenceNode.Label];

		if(monitorNode == null) {
			this.DynamicNodeMap[evidenceNode.Label] = new MonitorNode(location, item, condition, evidenceNode);
		}
		else {
			monitorNode.SetLocation(location);
			monitorNode.SetItem(item);
			monitorNode.SetCondition(condition);
		}

		if(Object.keys(this.DynamicNodeMap).length == 1) {   // manager has one monitor
			this.StartMonitoring(5000);
		}
	}

}
