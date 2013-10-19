/// <reference path="../Monitor/DynamicNodeManager.ts" />


class ActionNodeManager extends DynamicNodeManager {

	SetActionNode(evidenceNode: AssureIt.NodeModel) {
		var location: string = getContextNode(evidenceNode.Parent).Notes["Location"];
		var actionNode = this.DynamicNodeMap[evidenceNode.Label];

		if(actionNode == null) {
			this.DynamicNodeMap[evidenceNode.Label] = new ActionNode(location, evidenceNode);
		}
		else {
			actionNode.SetLocation(location);
		}

		if(Object.keys(this.DynamicNodeMap).length == 1) {   // manager has one monitor
			this.StartMonitoring(5000);
		}
	}

}
