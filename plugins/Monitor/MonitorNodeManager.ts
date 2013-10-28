/// <reference path="../ActionNode/ActionNodeManager.ts" />


class MonitorNodeManager extends ActionNodeManager {

	SetMonitorNode(evidenceNode: AssureIt.NodeModel) {
		var location: string = "";
		if("Location" in evidenceNode.Notes) {
			location = evidenceNode.Notes["Location"];
		}
		else if("Location" in evidenceNode.Environment) {
			location = evidenceNode.Environment["Location"];
		}

		var condition: string = "";
		if("Monitor" in evidenceNode.Notes) {
			condition = evidenceNode.Notes["Monitor"];
		}
		else if("Monitor" in evidenceNode.Environment) {
			condition = evidenceNode.Environment["Monitor"];
		}

		var item: string = extractItemFromCondition(condition);
		var monitorNode: MonitorNode = <MonitorNode>this.ActionNodeMap[evidenceNode.Label];

		if(monitorNode == null) {
			this.ActionNodeMap[evidenceNode.Label] = new MonitorNode(location, item, condition, evidenceNode);
		}
		else {
			monitorNode.SetLocation(location);
			monitorNode.SetItem(item);
			monitorNode.SetCondition(condition);
			return;
		}

		if(Object.keys(this.ActionNodeMap).length == 1) {   // manager has one monitor
			this.StartMonitoring(5000);
		}
	}

}
