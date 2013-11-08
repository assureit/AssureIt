import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;

class StringReader {
	int CurrentPos;
	String Text;
	StringReader(String Text) {
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

class StringWriter {
	public final static String LineFeed = "\n";
	StringBuilder sb;
	StringWriter() {
		this.sb = new StringBuilder();
	}
	void print(String s) {
		this.sb.append(s);
	}
	void println(String s) {
		this.sb.append(s);
		this.sb.append(LineFeed);
	}
	void println() {
		this.sb.append(LineFeed);
	}
	public String toString() {
		return sb.toString();
	}
}

enum GSNType {
	Goal, Context, Strategy, Evidence, Undefined;
}

class NodeHistory {
	String Author;
	String Role;
	String Date;
	String Process;
	NodeHistory(String Author, String Role, String Date, String Process) {
		this.Author = Author;
		this.Role = Role;
		this.Date = Date;
		this.Process = Process;
	}

	public static NodeHistory CreateDefaultHistory() {
		return new NodeHistory(null, null, null, null);
	}
	
	public String toString() {
		if(this.Author == null) return "-";
		return "$" + this.Author + ";" + this.Role + ";" + this.Date + ";" + this.Process;
	}
	
}

class WikiSyntax {
	public final static String VersionDelim = "=====";
	
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
				return GSNType.Context;
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
			case Goal :     return "G";
			case Context :  return "C";
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
				return new NodeHistory(Records[0], Records[1], Records[2], Records[3]);
			}
			catch(Exception e) {
				// any parser error is treated null
			}
		}
		return null;
	}

	public static String FormatRefKey(GSNType NodeType, String LabelNumber, NodeHistory History) {
		return WikiSyntax.FormatNodeType(NodeType)+LabelNumber+History.toString();
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
	
	static void FormatDigest(byte[] Digest, StringWriter Writer) {
		if(Digest != null) {
			for(int i = 0; i < Digest.length; i++) {
				int hex = Digest[i] < 0 ? 256 + Digest[i] : Digest[i];
				//Stream.append(":");
				if(hex < 16) {
					Writer.print("0");					
				}
				Writer.print(Integer.toString(hex, 16));
			}
		}
	}
	
	static boolean EqualsDigest(byte[] Digest, byte[] Digest2) {
		if(Digest != null && Digest2 != null) {
			for(int i = 0; i < Digest.length; i++) {
				if(Digest[i] != Digest2[i]) return false;
			}
			return true;
		}
		return Digest == null && Digest2 == null;
	}
}

class GSNNode {
	GSNDoc BaseDoc;
	GSNNode ParentNode;
	ArrayList<GSNNode> SubNodeList;
	GSNType NodeType;
	int GoalLevel;       /* 1: top level */
	String LabelNumber;  /* e.g, G1 G1.1 */
	int SectionCount;
	NodeHistory HistoryInfo;
	String NodeDoc;
	boolean HasTag;
	HashMap<String, String> TagMap;
	byte[] Digest;

	GSNNode(GSNDoc BaseDoc, GSNNode ParentNode, int GoalLevel, GSNType NodeType, String LabelNumber, NodeHistory HistoryInfo) {
		this.BaseDoc = BaseDoc;
		this.ParentNode = ParentNode;
		this.GoalLevel = GoalLevel;
		this.NodeType = NodeType;
		this.LabelNumber = LabelNumber;
		this.SectionCount = 0;
		this.SubNodeList = null;
		this.HistoryInfo = HistoryInfo == null ? BaseDoc.DocHistory : HistoryInfo;
		this.Digest = null;
		this.NodeDoc = StringWriter.LineFeed;
		this.HasTag = false;
		if(this.ParentNode != null) {
			ParentNode.AppendSubNode(this);
		}
	}

	public GSNNode Duplicate(GSNDoc BaseDoc, GSNNode ParentNode) {
		GSNNode NewNode = new GSNNode(BaseDoc, ParentNode, this.GoalLevel, this.NodeType, this.LabelNumber, null);
		NewNode.Digest = this.Digest;
		NewNode.NodeDoc = this.NodeDoc;
		NewNode.HasTag = this.HasTag;
		BaseDoc.UncheckAddNode(NewNode);
		if(this.SubNodeList != null) {
			for(GSNNode Node : this.SubNodeList) {
				Node.Duplicate(BaseDoc, NewNode);
			}
		}
		return NewNode;
	}

	void UpdateBody(ArrayList<String> LineList) {
		int LineCount = 0;
		StringWriter Writer = new StringWriter();
		MessageDigest md = MD5.GetMD5();
		for(String Line : LineList) {
			int Loc = Line.indexOf("::");
			if(Loc > 0) {
				this.HasTag = true;
			}
			Writer.println();
			Writer.print(Line);
			if(Line.length() > 0) {
				MD5.UpdateMD5(md, Line);
				LineCount += 1;
			}
		}
		if(LineCount > 0) {
			this.Digest = md.digest();
			this.NodeDoc = Writer.toString();
		}
		else {
			this.Digest = null;
			this.NodeDoc = StringWriter.LineFeed;
		}
	}
	
//	void UpdateBody() {
//	StringStream Stream = new StringStream(Text);
//	HashMap<String, String> TagMap = new HashMap<String, String>();
//	StringWriter sb = new StringWriter();
//	MessageDigest md = MD5.GetMD5();
//	while(Stream.HasNext()) {
//		String Line = Stream.ReadLine();
//		int Loc = Line.indexOf("::");
//		if(Loc > 0) {
//			ASN.ParseTag(TagMap, Line);
//		}
//		sb.append(StringWriter.LineFeed);
//		sb.append(Line);
//		MD5.UpdateMD5(md, Line);
//	}
//	if(this.Digest == null) {
//		this.Digest = md.digest();
//		this.NodeDoc = sb.toString();
//		if(TagMap.size() > 0) {
//			this.TagMap = TagMap;
//		}
//	}
//	else {
//		byte[] Digest = md.digest();
//		if(!MD5.EqualsDigest(this.Digest, Digest)) {
//			this.Digest = Digest;
//			this.NodeDoc = sb.toString();
//			this.TagMap = (TagMap.size() > 0) ? TagMap : null;
//		}
//	}
//}

	HashMap<String,String> GetTagMap() {
		if(this.TagMap == null && this.HasTag) {
			this.TagMap = new HashMap<String,String>();
			StringReader Reader = new StringReader(this.NodeDoc);
			while(Reader.HasNext()) {
				String Line = Reader.ReadLine();
				int Loc = Line.indexOf("::");
				if(Loc > 0) {
					WikiSyntax.ParseTag(this.TagMap, Line);
				}
			}
		}
		return this.TagMap;
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
			return new GSNNode(this.BaseDoc, this, this.GoalLevel, GSNType.Strategy, this.LabelNumber, null);
		}
		return null;
	}
	
	void FormatNode(HashMap<String, GSNNode> RefMap, StringWriter Stream) {
		Stream.print(WikiSyntax.FormatGoalLevel(this.GoalLevel));
		Stream.print(" ");
		Stream.print(WikiSyntax.FormatNodeType(this.NodeType));
		Stream.print(this.LabelNumber);
//		Stream.append(" ");
//		MD5.FormatDigest(this.Digest, Stream);
		Stream.print(" ");
		Stream.print(this.HistoryInfo.toString());
		String RefKey = WikiSyntax.FormatRefKey(this.NodeType, this.LabelNumber, this.HistoryInfo);
		GSNNode RefNode = null;
		if(RefMap != null) {
			RefNode = RefMap.get(RefKey);
		}
		if(RefNode == null) {
			Stream.print(this.NodeDoc);
			if(this.Digest != null) {
				Stream.println();
			}
			if(RefMap != null) {
				RefMap.put(RefKey, this);
			}
		}
		else {
			Stream.println();
		}
		if(this.SubNodeList != null) {
			for(GSNNode Node : this.SubNodeList) {
				Node.FormatNode(RefMap, Stream);
			}
		}
	}

}

class GSNDoc {
	GSNNode TopGoal;
	HashMap<String, GSNNode> NodeMap;
	HashMap<String, String> DocTagMap;
	NodeHistory DocHistory;
	int GoalCount;

	GSNDoc() {
		this.TopGoal = null;
		this.NodeMap = new HashMap<String, GSNNode>();
		this.DocTagMap = new HashMap<String,String>();
		this.DocHistory = NodeHistory.CreateDefaultHistory();
		this.GoalCount = 0;
	}
	
	GSNDoc Duplicate(String Author, String Role, String Date, String Process) {
		GSNDoc NewDoc = new GSNDoc();
		NewDoc.GoalCount = this.GoalCount;
		NewDoc.DocHistory = new NodeHistory(Author, Role, Date, Process);
		NewDoc.DocTagMap = this.DuplicateTagMap(this.DocTagMap);
		if(this.TopGoal != null) {
			NewDoc.TopGoal = this.TopGoal.Duplicate(NewDoc, null);
		}
		return NewDoc;
	}

	HashMap<String,String> DuplicateTagMap(HashMap<String,String> TagMap) {
		if(TagMap != null) {
			HashMap<String, String> NewMap = new HashMap<String, String>();
			for(String Key : TagMap.keySet()) {
				NewMap.put(Key, TagMap.get(Key));
			}
			return NewMap;
		}
		return null;
	}

	void UncheckAddNode(GSNNode Node) {
		String Key =  Node.NodeType + Node.LabelNumber;
		this.NodeMap.put(Key, Node);
	}
	
	void AddNode(GSNNode Node) {
		String Key =  Node.NodeType + Node.LabelNumber;
		GSNNode OldNode = this.NodeMap.get(Key);
		if(OldNode != null) {
			if(MD5.EqualsDigest(OldNode.Digest, Node.Digest)) {
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
//				System.err.println("num = " + num + ", GoalCount = " + this.GoalCount);
				if(num > this.GoalCount) {
					this.GoalCount = num;
				}
			}
			catch(Exception e) {
			}
		}
	}

	private String UniqueNumber(GSNType NodeType, String LabelNumber) {
		GSNNode Node = this.NodeMap.get(WikiSyntax.FormatNodeType(NodeType) + LabelNumber);
		if(Node == null) {
			return LabelNumber;
		}
		return this.UniqueNumber(NodeType, LabelNumber+"'");
	}

	String CheckLabelNumber(GSNNode ParentNode, GSNType NodeType, String LabelNumber) {
		if(LabelNumber == null) {
			if(NodeType == GSNType.Goal) {
				this.GoalCount += 1;
				LabelNumber = "" + this.GoalCount;
			}
			else {
				GSNNode GoalNode = ParentNode.GetCloseGoal();
				GoalNode.SectionCount += 1;
				LabelNumber = GoalNode.LabelNumber + "." + GoalNode.SectionCount;
			}
		}
		return this.UniqueNumber(NodeType, LabelNumber);
	}
	
	void UpdateNode(GSNNode Node, StringReader Stream, HashMap<String, GSNNode> RefMap) {
		ParserContext Context = new ParserContext(this, Node);
		GSNNode LastNode = null;
		ArrayList<String> LineList = new ArrayList<String>();
		while(Stream.HasNext()) {
			String Line = Stream.ReadLine();
			if(Line.startsWith(WikiSyntax.VersionDelim)) {
				break;
			}
			if(Line.startsWith("*")) {
				if(Context.IsValidNode(Line)) {
					if(LastNode != null) {
						LastNode.UpdateBody(LineList);
					}
					LineList.clear();
					if(!Context.CheckRefMap(RefMap, Line)) {
						LastNode = Context.AppendNewNode(Line, RefMap);
					}
					else {
						LastNode = null;
					}
					continue;
				}
			}
			if(LastNode == null) {
				WikiSyntax.ParseTag(Context.BaseDoc.DocTagMap, Line);
			}
			LineList.add(Line);
		}
		if(LastNode != null) {
			LastNode.UpdateBody(LineList);
		}
	}

	void RemoveNode(GSNNode Node) {

	}
	
	void FormatDoc(HashMap<String, GSNNode> NodeRef, StringWriter Stream) {
		if(this.TopGoal != null) {
			this.TopGoal.FormatNode(NodeRef, Stream);
		}
	}
}

class ParserContext {
	GSNDoc BaseDoc;
	ArrayList<GSNNode> GoalStackList;
	GSNNode LastGoalNode;

	ParserContext(GSNDoc BaseDoc, GSNNode BaseNode) {
		this.BaseDoc = BaseDoc;
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
		while(this.GoalStackList.size() < Level + 1) {
			this.GoalStackList.add(null);
		}
		this.GoalStackList.set(Level, Node);
	}

	public boolean IsValidNode_(String Line) {
		int Level = WikiSyntax.ParseGoalLevel(Line);
		GSNType NodeType = WikiSyntax.ParseNodelType(Line);
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

	public boolean IsValidNode(String Line) {
		boolean b = IsValidNode_(Line);
		//System.err.println("IsValidNode? '" + Line + "' ? " + b);
		return b;
	}
	
	boolean CheckRefMap(HashMap<String, GSNNode> RefMap, String LabelLine) {
		if(RefMap != null) {
			GSNType NodeType = WikiSyntax.ParseNodelType(LabelLine);
			String LabelNumber = WikiSyntax.ParseLabelNumber(LabelLine);
			NodeHistory  GivenHistory = WikiSyntax.ParseHistory(LabelLine);
			if(LabelNumber != null && GivenHistory != null) {
				String RefKey = WikiSyntax.FormatRefKey(NodeType, LabelNumber, GivenHistory);
				GSNNode RefNode = RefMap.get(RefKey);
				GSNNode NewNode = null;
				if(RefNode != null) {
					if(NodeType == GSNType.Goal) {			
						int Level = WikiSyntax.ParseGoalLevel(LabelLine);
						GSNNode ParentNode = this.GetParentNodeOfGoal(Level);
						NewNode = new GSNNode(this.BaseDoc, ParentNode, Level, NodeType, LabelNumber, GivenHistory);
						this.SetGoalStackAt(Level, NewNode);
						this.LastGoalNode = NewNode;
					}
					else {
						GSNNode ParentNode = this.LastGoalNode;
						if(NodeType == GSNType.Context) {
							ParentNode = ParentNode.GetLastNodeOrSelf();
						}
						NewNode = new GSNNode(this.BaseDoc, ParentNode, ParentNode.GoalLevel, NodeType, LabelNumber, GivenHistory);
					}
					this.BaseDoc.AddNode(NewNode);
					NewNode.NodeDoc = RefNode.NodeDoc;
					NewNode.Digest = RefNode.Digest;
					return true;
				}
			}
		}
		return false;
	}
	
	public GSNNode AppendNewNode(String LabelLine, HashMap<String, GSNNode> RefMap) {
		GSNType NodeType = WikiSyntax.ParseNodelType(LabelLine);
		String LabelNumber = WikiSyntax.ParseLabelNumber(LabelLine);
		NodeHistory  GivenHistory = WikiSyntax.ParseHistory(LabelLine);
		GSNNode NewNode = null;
		if(NodeType == GSNType.Goal) {			
			int Level = WikiSyntax.ParseGoalLevel(LabelLine);
			GSNNode ParentNode = this.GetParentNodeOfGoal(Level);
			LabelNumber = this.BaseDoc.CheckLabelNumber(ParentNode, NodeType, LabelNumber);
			NewNode = new GSNNode(this.BaseDoc, ParentNode, Level, NodeType, LabelNumber, GivenHistory);
			this.SetGoalStackAt(Level, NewNode);
			this.LastGoalNode = NewNode;
		}
		else {
			GSNNode ParentNode = this.LastGoalNode;
			if(NodeType == GSNType.Context) {
				ParentNode = ParentNode.GetLastNodeOrSelf();
			}
			LabelNumber = this.BaseDoc.CheckLabelNumber(ParentNode, NodeType, LabelNumber);
			NewNode = new GSNNode(this.BaseDoc, ParentNode, ParentNode.GoalLevel, NodeType, LabelNumber, GivenHistory);
		}
		this.BaseDoc.AddNode(NewNode);
		if(RefMap != null && GivenHistory != null) {
			String RefKey = WikiSyntax.FormatRefKey(NodeType, LabelNumber, GivenHistory);
			RefMap.put(RefKey, NewNode);
		}
		return NewNode;
	}
}

class GSNCase {
	ArrayList<GSNDoc> DocList;
	GSNDoc EditingDoc;
	
	GSNCase() {
		this.DocList = new ArrayList<GSNDoc>();
		this.EditingDoc = null;
	}
		
	void Parse(String TextDoc) {
		HashMap<String, GSNNode> RefMap = new HashMap<String, GSNNode>();
		StringReader Reader = new StringReader(TextDoc);
		while(Reader.HasNext()) {
			GSNDoc Doc = new GSNDoc();
			Doc.UpdateNode(null, Reader, RefMap);
			this.DocList.add(Doc);
		}
	}

//	public void Renumber() {
//		HashMap<String, String> LabelMap = new HashMap<String, String>();
//		GSNDoc LatestDoc = this.DocList.get(0);
//		if(LatestDoc.TopGoal != null) {
//			LatestDoc.TopGoal.CreateLabelMap(1, LabelMap);
//		}
//		for(GSNDoc Doc : this.DocList) {
//			if(Doc.TopGoal != null) {
//				Doc.TopGoal.Renumber(LabelMap);
//			}
//		}
//	}
	
	public void FormatCase(StringWriter Writer) {
		HashMap<String, GSNNode> RefMap = new HashMap<String, GSNNode>();
		for(int i = 0; i < this.DocList.size(); i++) {
			GSNDoc Doc = this.DocList.get(i);
			Doc.FormatDoc(RefMap, Writer);
			if(i != this.DocList.size() - 1) {
				Writer.println(WikiSyntax.VersionDelim);
			}
		}
	}

	public void StartToEdit(String Author, String Role, String Date, String Process) {
		if(this.EditingDoc == null) {
			if(this.DocList.size() > 0) {
				this.EditingDoc = this.DocList.get(0).Duplicate(Author, Role, Date, Process);
			}
			else {
				this.EditingDoc = new GSNDoc();
				this.EditingDoc.DocHistory = new NodeHistory(Author, Role, Date, Process);
			}
		}
	}

	public void Commit() {
		// TODO Auto-generated method stub
	}
	
}

public class AssureItNotation {
	
	public static String ReadFile(String File) {
		StringWriter sb = new StringWriter();
		try {
			BufferedReader br = new BufferedReader(new FileReader(File));
			String Line;
			int linenum = 0;
			while (( Line = br.readLine()) != null ) {
				if(linenum > 0) {
					sb.print(StringWriter.LineFeed);
				}
				sb.print(Line);
				linenum++;
			}
			br.close();
		}
		catch(IOException e) {
			System.err.println("cannot open: " + File);
		}
		return sb.toString();
	}
	
	public final static void main(String[] file) {
		String TextDoc = ReadFile(file[0]);
		GSNCase Case = new GSNCase();
		Case.Parse(TextDoc);
		Case.StartToEdit("u", "r", "d", "p");
		Case.Commit();
		StringWriter Writer = new StringWriter();
		Case.FormatCase(Writer);
		System.out.println("--------\n" + Writer.toString());
	}
}

