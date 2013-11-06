import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;

enum GSNType {
	Goal, Context, Strategy, Evidence, Undefined;
}

class NodeHistory {
	int Revision;
	String Author;
	String Role;
	String Date;
	String Process;
	NodeHistory(int Revision, String Author, String Role, String Date, String Process) {
		this.Revision = Revision;
		this.Author = Author;
		this.Role = Role;
		this.Date = Date;
		this.Process = Process;
	}

	public static NodeHistory CreateDefaultHistory() {
		return new NodeHistory(0, null, null, null, null);
	}
	
	String FormatLabelLine(String Label) {
		if(this.Revision > 0) {
			return Label + " $" + this.Revision + ";" + this.Author + ";" + this.Role + ";" + this.Date + ";" + this.Process;
		}
		return Label;
	}

	public String toString() {
		return "$" + this.Revision + ";" + this.Author + ";" + this.Role + ";" + this.Date + ";" + this.Process;
	}
	
}


class ASN {	
	static int ParseGoalLevel(String LabelLine) {
		int GoalLevel = 0;
		for(int i = 0; i < LabelLine.length(); i++) {
			if(LabelLine.charAt(i) != '*') break;
			GoalLevel++;
		}
		return GoalLevel;
	}
	static String FormatGoalLevel(int GoalLevel) {
		StringBuilder sb = new StringBuilder();
		for(int i = 0; i < GoalLevel; i++) {
			sb.append('*');
		}
		return sb.toString();
	}

	static GSNType ParseNodelType(String LabelLine) {
		int i;
		for(i = 0; i < LabelLine.length(); i++) {
			if(LabelLine.charAt(i) != '*') break;
		}
		for(; i < LabelLine.length(); i++) {
			if(LabelLine.charAt(i) != ' ') break;
		}
		if(i < LabelLine.length()) {
			char ch = LabelLine.charAt(i);
			if(ch == 'G') {
				return GSNType.Goal;
			}
			if(ch == 'C') {
				return GSNType.Goal;
			}
			if(ch == 'E') {
				return GSNType.Evidence;
			}
			if(ch == 'S') {
				return GSNType.Strategy;
			}
		}
		return GSNType.Undefined;
	}

	static String FormatNodeType(GSNType NodeType) {
		switch(NodeType) {
			case Goal : return "G";
			case Context : return "C";
			case Strategy : return "S";
			case Evidence : return "E";
			case Undefined: 
		}
		return "U";
	}

	static String ParseLabelNumber(String LabelLine) {
		int StartIdx = -1;
		for(int i = 0; i < LabelLine.length(); i++) {
			if(Character.isDigit(LabelLine.charAt(i))) {
				StartIdx = i;
				break;
			}
		}
		if(StartIdx != -1) {
			for(int i = StartIdx+1; i < LabelLine.length(); i++) {
				if(Character.isWhitespace(LabelLine.charAt(i))) {
					return LabelLine.substring(StartIdx, i);
				}
			}
			return LabelLine.substring(StartIdx);
		}
		return null;
	}

//	static NodeHistory NullHistory = CreateDefaultHistory();
	static HashMap<String, NodeHistory> HistoryMap = new HashMap<String,NodeHistory>();
	
	public static NodeHistory ParseHistory(String LabelLine) {
		int Loc = LabelLine.indexOf("$");
		if(Loc != -1) {
			try {
				String Record = LabelLine.substring(Loc+1).trim();
				NodeHistory History = HistoryMap.get(Record);
				if(History != null) {
					return History;
				}
				String[] Records = Record.split(";");
				return new NodeHistory(Integer.parseInt(Records[0]), Records[1], Records[2], Records[3], Records[4]);
			}
			catch(Exception e) {
			}
		}
		return null;
	}
		
	static void ParseTag(HashMap<String, String> TagMap, String Line) {
		int loc = Line.indexOf("::");
		if(loc != -1) {
			String Key = Line.substring(0, loc).toUpperCase().trim();
			String Value = Line.substring(loc+1).trim();
			TagMap.put(Key.toUpperCase(), Value);
		}
	}
}

class MD5 {
	static MessageDigest GetMD5() {
		try {
			MessageDigest digest = MessageDigest.getInstance("MD5");
			return digest;
		} catch (NoSuchAlgorithmException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
	}
	static void UpdateMD5(MessageDigest md, String Text) {
		md.update(Text.getBytes());
	}
}

class GSNNode {
	GSNDoc BaseDoc;
	GSNNode ParentNode;
	ArrayList<GSNNode> SubNodeList;
	GSNType NodeType;
	int GoalLevel;   /* 1: top level */
	String LabelNumber;  /* e.g, G1 */
	NodeHistory HistoryInfo;
	String NodeDoc;
	HashMap<String, String> TagMap;
	byte[] Digest;

	GSNNode(GSNDoc BaseDoc, GSNNode ParentNode, int GoalLevel, GSNType NodeType, String LabelNumber, NodeHistory HistoryInfo, ArrayList<String> LineList) {
		this.BaseDoc = BaseDoc;
		this.ParentNode = ParentNode;
		this.GoalLevel = GoalLevel;
		this.NodeType = NodeType;
		this.LabelNumber = LabelNumber;
		this.HistoryInfo = HistoryInfo == null ? BaseDoc.DefaultHistory : HistoryInfo;
		this.SubNodeList = null;
		if(LineList != null) {
			StringBuilder sb = new StringBuilder();
			MessageDigest md = MD5.GetMD5();
			int linenum = 0;
			for(String Line : LineList) {
				int Loc = Line.indexOf("::");
				if(Loc > 0) {
					if(this.TagMap == null) {
						this.TagMap = new HashMap<String, String>();
					}
					ASN.ParseTag(this.TagMap, Line);
				}
				if(linenum > 0) {
					sb.append("\n");
				}
				sb.append(Line);
				MD5.UpdateMD5(md, Line);
				linenum++;
			}
			this.Digest = md.digest();
			this.NodeDoc = sb.toString();
		}
		else {
			this.Digest = null;
			this.NodeDoc = "";
		}
		if(this.ParentNode != null) {
			ParentNode.AppendSubNode(this);
		}
	}

	boolean EqualsBody(GSNNode Node) {
		if(this.Digest != null && Node.Digest != null) {
			for(int i = 0; i < this.Digest.length; i++) {
				if(this.Digest[i] != Node.Digest[i]) return false;
			}
			return true;
		}
		return (this.Digest == null && Node.Digest == null);
	}

	void  AppendSubNode(GSNNode Node) {
		if(this.SubNodeList == null) {
			this.SubNodeList = new ArrayList<GSNNode>();
		}
		this.SubNodeList.add(Node);
	}

	GSNNode GetCloseGoal() {
		GSNNode Node = this;
		while(Node.NodeType != GSNType.Goal) {
			Node = Node.ParentNode;
		}
		return Node;
	}

	boolean HasSubNode(GSNType NodeType) {
		if(this.SubNodeList != null) {
			for(int i = this.SubNodeList.size() - 1; i >= 0; i--) {
				GSNNode Node = this.SubNodeList.get(i);
				if(Node.NodeType == NodeType) {
					return true;
				}
			}
		}
		return false;
	}

	GSNNode GetLastNodeOrSelf() {
		if(this.SubNodeList != null) {
			return this.SubNodeList.get(this.SubNodeList.size() - 1);
		}
		return this;
	}

	GSNNode GetLastNode(GSNType NodeType) {
		if(this.SubNodeList != null) {
			for(int i = this.SubNodeList.size() - 1; i >= 0; i--) {
				GSNNode Node = this.SubNodeList.get(i);
				if(Node.NodeType == NodeType) {
					return Node;
				}
			}
		}
		if(NodeType == GSNType.Strategy) {
			return new GSNNode(this.BaseDoc, this, this.GoalLevel, GSNType.Strategy, this.LabelNumber, null, null);
		}
		return null;
	}
	
}

class GSNDoc {
	GSNNode TopGoal;
	HashMap<String, GSNNode> NodeMap;
	HashMap<String, String> DocTagMap;
	NodeHistory DefaultHistory;
	int GoalCount;
	int Revision;

	GSNDoc() {
		this.TopGoal = null;
		this.NodeMap = new HashMap<String, GSNNode>();
		this.DocTagMap = new HashMap<String,String>();
		this.DefaultHistory = NodeHistory.CreateDefaultHistory();
		this.GoalCount = 1;
		this.Revision = 0;
	}
	
	void AddNode(GSNNode Node) {
		String Key =  Node.NodeType + Node.LabelNumber;
		GSNNode OldNode = this.NodeMap.get(Key);
		if(OldNode != null) {
			if(OldNode.EqualsBody(Node)) {
				Node.HistoryInfo = OldNode.HistoryInfo;
			}
		}
		this.NodeMap.put(Key, Node);
		if(Node.NodeType == GSNType.Goal) {
			if(Node.GoalLevel == 1) {
				this.TopGoal = Node;
			}
			try {
				int num = Integer.parseInt(Node.LabelNumber);
				if(num > this.GoalCount) {
					this.GoalCount = num;
				}
			}
			catch(Exception e) {
			}
		}
	}

	private String UniqueNumber(GSNNode ParentNode, GSNType NodeType, String LabelNumber) {
		GSNNode Node = this.NodeMap.get("" + NodeType + LabelNumber);
		if(Node == null) {
			return LabelNumber;
		}
		return this.UniqueNumber(ParentNode, NodeType, LabelNumber+"'");
	}

	String CheckLabelNumber(GSNNode ParentNode, GSNType NodeType, String LabelLine) {
		String LabelNumber = ASN.ParseLabelNumber(LabelLine);
		if(LabelNumber == null) {
			if(NodeType == GSNType.Goal) {
				this.GoalCount += 1;
				LabelNumber = "" + this.GoalCount;
			}
			else {
				GSNNode GoalNode = ParentNode.GetCloseGoal();
				LabelNumber = GoalNode.LabelNumber;
			}
		}
		return this.UniqueNumber(ParentNode, NodeType, LabelNumber);
	}
	
	void UpdateNode(GSNNode Node, StringStream Stream) {
		ParserContext GoalStack = new ParserContext(this, Node);
		String LabelLine = null;
		ArrayList<String> BufferList = new ArrayList<String>();
		boolean CommentingOut = false;
		while(Stream.HasNext()) {
			String Line = Stream.ReadLine();
			System.err.println(": " + Line);
			if(CommentingOut) {
				BufferList.add(Line);
				if(Line.startsWith("***/")) {
					CommentingOut=false;
				}
			}
			else {
				if(Line.startsWith("/***")) {
					CommentingOut = true;
				}
				if(Line.startsWith("========")) {
					if(LabelLine != null) {
						GoalStack.AppendNewNode(LabelLine, BufferList);
					}
					break;
				}
				if(Line.startsWith("*")) {
					if(GoalStack.IsValidNode(Line)) {
						if(LabelLine != null) {
							GoalStack.AppendNewNode(LabelLine, BufferList);
						}
						LabelLine = Line;
						BufferList.clear();
						continue;
					}
				}
				if(LabelLine == null) {
					ASN.ParseTag(GoalStack.NewDoc.DocTagMap, Line);
				}
				BufferList.add(Line);
			}
		}
		if(LabelLine != null) {
			GoalStack.AppendNewNode(LabelLine, BufferList);
		}
	}

	void RemoveNode(GSNNode Node) {

	}
}

class StringStream {
	int CurrentPos;
	String Text;
	StringStream(String Text) {
		this.Text = Text;
		this.CurrentPos = 0;
	}
	boolean HasNext() {
		return this.CurrentPos < this.Text.length();
	}
	String ReadLine() {
		int StartPos = this.CurrentPos;
		int i;
		for(i = this.CurrentPos; i < this.Text.length(); i++) {
			char ch = this.Text.charAt(i);
			if(ch == '\n') {
				int EndPos = i;
				this.CurrentPos = i + 1;
				return this.Text.substring(StartPos, EndPos).trim();
			}
			if(ch == '\r') {
				int EndPos = i;
				if(i+1 < this.Text.length() && this.Text.charAt(i+1) == '\n') {
					i++;
				}
				this.CurrentPos = i + 1;
				return this.Text.substring(StartPos, EndPos).trim();
			}
		}
		this.CurrentPos = i;
		if(StartPos == this.CurrentPos) {
			return null;
		}
		return this.Text.substring(StartPos, this.CurrentPos).trim();
	}
}

class ParserContext {
	GSNDoc NewDoc;
	ArrayList<GSNNode> GoalStackList;
	GSNNode LastGoalNode;
	int GoalLevel;
	int BaseLevel;

	ParserContext(GSNDoc BaseDoc, GSNNode BaseNode) {
		this.NewDoc = BaseDoc;
		this.GoalStackList = new ArrayList<GSNNode>();
		if(BaseNode != null) {
			this.LastGoalNode = BaseNode.GetCloseGoal();
			if(BaseNode.NodeType == GSNType.Goal) {
				this.SetGoalStackAt(BaseNode.GoalLevel, BaseNode);
			}
		}
		else {
			this.LastGoalNode = null;
		}
	}
		
	GSNNode GetGoalStackAt(int Level) {
		if(Level < this.GoalStackList.size()) {
			return this.GoalStackList.get(Level);
		}
		return null;
	}

	GSNNode GetParentNodeOfGoal(int Level) {
		if(Level - 1< this.GoalStackList.size()) {
			GSNNode ParentGoal = this.GoalStackList.get(Level - 1);
			if(ParentGoal != null) {
				return ParentGoal.GetLastNode(GSNType.Strategy);
			}
		}
		return null;
	}

	void SetGoalStackAt(int Level, GSNNode Node) {
		this.GoalStackList.ensureCapacity(Level + 1);
		this.GoalStackList.set(Level, Node);
	}

	public boolean IsValidNode(String Line) {
		System.err.println("IsValidNode? " + Line);
		int Level = ASN.ParseGoalLevel(Line);
		GSNType NodeType = ASN.ParseNodelType(Line);
		if(NodeType == GSNType.Goal) {
			GSNNode ParentNode = this.GetParentNodeOfGoal(Level);
			if(ParentNode != null) {
				return true;
			}
			if(Level == 1 && this.LastGoalNode == null) {
				return true;
			}
			return false;
		}
		if(this.LastGoalNode != null) {
			if(NodeType == GSNType.Context) {
				GSNNode LastNode = this.LastGoalNode.GetLastNodeOrSelf();
				if(LastNode.NodeType == GSNType.Context) {
					return false;
				}
				return true;
			}
			if(NodeType == GSNType.Strategy) {
				return !this.LastGoalNode.HasSubNode(GSNType.Evidence);
			}
			if(NodeType == GSNType.Evidence) {
				return !this.LastGoalNode.HasSubNode(GSNType.Strategy);
			}
		}
		return false;
	}

	void AppendNewNode(String LabelLine, ArrayList<String> BufferList) {
		GSNType NodeType = ASN.ParseNodelType(LabelLine);
		NodeHistory  GivenHistory = ASN.ParseHistory(LabelLine);
		GSNNode NewNode = null;
		if(NodeType == GSNType.Goal) {			
			int Level = ASN.ParseGoalLevel(LabelLine);
			GSNNode ParentNode = this.GetParentNodeOfGoal(Level);
			String LabelNumber = this.NewDoc.CheckLabelNumber(ParentNode, NodeType, LabelLine);
			NewNode = new GSNNode(this.NewDoc, ParentNode, Level, NodeType, LabelNumber, GivenHistory, BufferList);
			this.SetGoalStackAt(Level, NewNode);
			this.LastGoalNode = NewNode;
		}
		else {
			GSNNode ParentNode = this.LastGoalNode;
			if(NodeType == GSNType.Context) {
				ParentNode = ParentNode.GetLastNodeOrSelf();
			}
			String LabelNumber = this.NewDoc.CheckLabelNumber(ParentNode, NodeType, LabelLine);
			NewNode = new GSNNode(this.NewDoc, ParentNode, ParentNode.GoalLevel, NodeType, LabelNumber, GivenHistory, BufferList);
		}
		this.NewDoc.AddNode(NewNode);
	}
}

public class AssureItNotation {

	public final static void main(String[] file) {
		String LabelLine = "** Goal12' $1;kiki;developer;today;Development";
		System.err.println("GoalLevel="+ASN.ParseGoalLevel(LabelLine));
		System.err.println("NodeType="+ASN.ParseNodelType(LabelLine));
		System.err.println("LabelNumber="+ASN.ParseLabelNumber(LabelLine));
		System.err.println("History="+ASN.ParseHistory(LabelLine));
	}
	
	public final static void main2(String[] file) throws IOException {
		BufferedReader br = new BufferedReader(new FileReader(file[0]));
		StringBuilder sb = new StringBuilder();
		String msg;
		int linenum = 0;
		while (( msg = br.readLine()) != null ) {
			System.out.println(msg);
			if(linenum > 0) {
				sb.append("\n");
			}
			sb.append(msg);
			linenum++;
		}
		br.close();
		GSNDoc Doc = new GSNDoc();
		Doc.UpdateNode(null, new StringStream(sb.toString()));
	}
}

