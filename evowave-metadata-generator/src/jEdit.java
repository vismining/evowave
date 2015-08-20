import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;

public class jEdit {

	public static final int READING_SUBJECT = 0;
	public static final int READING_DIFF = 1;
	
	public static void main(String[] args) throws IOException {

		File dir = new File("C:" + File.separator + "Users" + File.separator + "Rodrigo Magnavita" + File.separator + "Documents" + File.separator + "Masters" + File.separator + "projects" + File.separator + "jedit-jEdit.bak");
		File fin = new File(dir.getCanonicalPath() + File.separator + "git.log");
		
		BufferedReader br = new BufferedReader(new FileReader(fin));
	 
		int reading = READING_SUBJECT;
		
		ArrayList<HashMap<String, Object>> commits = new ArrayList<HashMap<String, Object>>();
		
		HashMap<String, Object> commit = null;
		
		SimpleDateFormat dateFormat = new SimpleDateFormat("E MMM dd kk:mm:ss yyyy");
		
		String line = "";
		
		try {
			
			line = br.readLine();
			
			do {

				if(line.startsWith("commit")){
					commit = new HashMap<String, Object>();
					commits.add(commit);
					
					commit.put("hashid", line.substring("commit ".length(), line.length()));
					commit.put("subject", "");
					commit.put("files", new ArrayList<HashMap<String, Object>>());
					reading = READING_SUBJECT;
				} else if(line.startsWith("Author")){
					commit.put("author", line.substring("Author: ".length(), line.lastIndexOf(" <")));
					commit.put("email", line.substring(line.lastIndexOf("<")+1, line.lastIndexOf(">")));
				} else if(line.startsWith("Date")){
					commit.put("date", dateFormat.parse(line.substring("Date:   ".length(), line.length())));
					br.readLine();
				} else if(line.startsWith("diff")) {
					HashMap<String, Object> file = new HashMap<String, Object>();
					((ArrayList<HashMap<String, Object>>) commit.get("files")).add(file);
					file.put("file", line.substring("diff --git a/".length(), line.lastIndexOf(" b/")));
					br.readLine();
					br.readLine();
					br.readLine();
					reading = READING_DIFF;
				} else if(line.startsWith("@@")) {
					
				} else {
					if(reading == READING_SUBJECT){
						commit.put("subject", (String) commit.get("subject") + '\n' + line);
					}else if(reading == READING_DIFF) {
						if(line.startsWith("+")){
							
						} else if(line.startsWith("-")){
							
						} else {
							
						}
					}
				}
				
			} while((line = br.readLine()) != null);
		} catch (Exception e) {
			System.out.println(line);
		}
	 
		br.close();
		
		System.out.println(commits);
		
	}
	
}
