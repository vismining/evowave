import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.joda.time.DateTime;
import org.joda.time.Days;
import org.joda.time.Months;

public class jEdit {

	public static final int READING_REJECT = -1;
	public static final int READING_SUBJECT = 0;
	public static final int READING_DIFF = 1;
	
	public static void main(String[] args) throws IOException {

		File d = new File("C:" + File.separator + "Users" + File.separator + "Rodrigo Magnavita" + File.separator + "Documents" + File.separator + "Masters" + File.separator + "projects" + File.separator + "jedit-jEdit.bak");
		File fin = new File(d.getCanonicalPath() + File.separator + "git.log");
		
		BufferedReader br = new BufferedReader(new FileReader(fin));
	 
		int reading = READING_SUBJECT;
		
		ArrayList<HashMap<String, Object>> commits = new ArrayList<HashMap<String, Object>>();
		
		HashMap<String, Object> commit = null;
		
		HashMap<String, Object> file = null;
		
		HashMap<String, Object> diff = null;
		
		HashMap<String, String> javaPackageGlossary = new HashMap<String, String>();
		HashMap<String, String> authorGlossary = new HashMap<String, String>();
		
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
					
					if(!authorGlossary.containsKey(commit.get("author"))){
						
						Random r = new Random();
				        StringBuffer sb = new StringBuffer();
				        while(sb.length() < 6){
				            sb.append(Integer.toHexString(r.nextInt(255)));
				        }
				        
						authorGlossary.put((String) commit.get("author"), ("FF" + sb.toString().substring(0, 6)));
					}
					
					commit.put("email", line.substring(line.lastIndexOf("<")+1, line.lastIndexOf(">")));
				} else if(line.startsWith("Date")){
					commit.put("date", dateFormat.parse(line.substring("Date:   ".length(), line.length())));
					br.readLine();
				} else if(line.startsWith("diff")) {
					file = new HashMap<String, Object>();
					((ArrayList<HashMap<String, Object>>) commit.get("files")).add(file);
					file.put("file", line.substring("diff --git a/".length(), line.lastIndexOf(" b/")));
					file.put("diffs", new ArrayList<HashMap<String, Object>>());	
					
					reading = READING_REJECT;
				} else if(line.startsWith("@@")) {
					diff = new HashMap<String, Object>();
					((ArrayList<HashMap<String, Object>>) file.get("diffs")).add(diff);
					
					diff.put("a", line.substring("@@ ".length(), line.indexOf("+")-1));
					diff.put("b", line.substring(line.indexOf("+"), line.indexOf(" @@")));
					diff.put("diff", line.substring(line.indexOf(" @@") + " @@".length(), line.length()));
					reading = READING_DIFF;
				} else {
					if(reading == READING_SUBJECT){
						commit.put("subject", (String) commit.get("subject") + '\n' + line);
					}else if(reading == READING_DIFF) {
						diff.put("diff", (String) diff.get("diff") + '\n' + line);
					}
				}
				
			} while((line = br.readLine()) != null);
		} catch (Exception e) {
			e.printStackTrace();
			System.out.println(line);
		}
	 
		br.close();
		
		commits.sort(new Comparator<HashMap<String, Object>>() {
				@Override
				public int compare(HashMap<String, Object> o1, HashMap<String, Object> o2) {
					return ((Date) o1.get("date")).before((Date) o2.get("date")) ? -1 : 1;
				}
		});
		
		//System.out.println(commits);
		
		DateTime currDate = null;
		
		HashMap<String, HashMap<String, Object>> sectors = new HashMap<String, HashMap<String, Object>>();
		
		Integer windowPosition = 1;
		
		DateTime windowDate = null;
		
		for (HashMap<String, Object> c : commits) {
			
			ArrayList<HashMap<String, Object>> files = (ArrayList<HashMap<String, Object>>) c.get("files");
			
			currDate = new DateTime((Date) c.get("date"));
			
			if(currDate.getYear() < 2000){
				continue;
			}
			
			if(windowDate == null){
				windowDate = currDate;
			}
			
			// Days
			/*
			while (Days.daysBetween(windowDate, currDate).getDays() >= 1) {
				windowPosition++;
				windowDate = windowDate.plusDays(1);
			}
			*/
			
			// Weeks
			/*
			while (Days.daysBetween(windowDate, currDate).getDays() >= 7) {
				windowPosition++;
				windowDate = windowDate.plusDays(7);
			}
			*/
			
			// Months
			
			while (Months.monthsBetween(windowDate, currDate).getMonths() >= 1) {
				windowPosition++;
				windowDate = windowDate.plusMonths(1);
			}
			
			
			// Years
			/*
			while (Years.yearsBetween(windowDate, currDate).getYears() >= 1) {
				windowPosition++;
				windowDate = windowDate.plusYears(1);
			}
			*/
			
			for (HashMap<String, Object> f : files){
				String dir = "";
				String _file = (String) f.get("file");
				String fileName = _file;
				String fileType = "unknown";
				String javaPackage = "default";
				
				if(_file.contains("/")) {
					dir = _file.substring(0, _file.lastIndexOf("/"));
					fileName = _file.substring(dir.length(), _file.length());
				}
				
				if(fileName.contains(".") && !fileName.startsWith(".")){
					fileName = _file.substring(dir.length(), _file.lastIndexOf("."));
					fileType = _file.substring(_file.lastIndexOf("."), _file.length());
				}
				
				fileName = fileName.replace("/", "");
				
				if(dir.isEmpty()){
					dir = "/";
				}
				
				if(fileType.equals(".java")){
					
					ArrayList<HashMap<String, Object>> _diffs = (ArrayList<HashMap<String, Object>>) f.get("diffs");
					
					javaPackage = (String) javaPackageGlossary.get(_file);
					
					if(javaPackage == null){
						javaPackage = "default";
					}
					
					if(!javaPackageGlossary.containsKey(_file)){
						
						for( HashMap<String, Object> _diff : _diffs){
							String diff_text = (String) _diff.get("diff");
							if(Pattern.compile("\\+package .+;").matcher(diff_text).find()){
								
								Matcher matcher = Pattern.compile("\\+package .+;").matcher(diff_text);
								
								if(matcher.find()){
									javaPackage = diff_text.substring(matcher.start() + "package ".length()+1, matcher.end()-1);
									javaPackageGlossary.put(_file, javaPackage);
								}
								
							}
						}
						
					}
					
					HashMap<String, Object> sector = (HashMap<String, Object>) sectors.get(dir);
					
					sector = (HashMap<String, Object>) sectors.get(javaPackage);
					
					if(!sectors.containsKey(javaPackage)){
						sector = new HashMap<String, Object>();
						sector.put("windows", new HashMap<Integer, HashMap<String, Object>>());
						sectors.put(javaPackage, sector);
					}
					
					HashMap<Integer, HashMap<String, Object>> windows = (HashMap<Integer, HashMap<String, Object>>) sector.get("windows");
					
					HashMap<String, Object> window = windows.get(windowPosition);
					
					if(window == null){
						window = new HashMap<String, Object>();
						window.put("molecules", new ArrayList<HashMap<String, Object>>());
						windows.put(windowPosition, window);
					}
					
					ArrayList<HashMap<String, Object>> molecules = (ArrayList<HashMap<String, Object>>) window.get("molecules");
					
					HashMap<String, Object> molecule = new HashMap<String, Object>();
					molecules.add(molecule);

					molecule.put("color", authorGlossary.get(c.get("author")));
					
					
				}
				
			}
			
		}
		
		StringBuilder sb = new StringBuilder("{ window: { size: 5, amount: " + windowPosition + " }, sectors: [");
		
		Iterator<String> sectorsKeys = sectors.keySet().iterator();
		
		while(sectorsKeys.hasNext()) {
			String sectorKey = sectorsKeys.next();
			
			double angle = (double) (1 / ((double) sectors.values().size()));
			
			sb.append(" { angle: " + angle + ", label: '" + sectorKey + "', windows: [");
			
			HashMap<Integer, HashMap<String, Object>> windows = (HashMap<Integer, HashMap<String, Object>>) sectors.get(sectorKey).get("windows");
			
			Iterator<Integer> windowsKeys = (Iterator<Integer>) windows.keySet().iterator();
			
			while(windowsKeys.hasNext()){
				
				Integer windowKey = windowsKeys.next();
				
				HashMap<String, Object> window = windows.get(windowKey);
				
				sb.append(" { position: " + windowKey + ", molecules: [");
				
				ArrayList<HashMap<String, Object>> molecules = (ArrayList<HashMap<String, Object>>) window.get("molecules");
				
				for( HashMap<String, Object> molecule : molecules ){
					sb.append(" { color: '" + molecule.get("color") + "' },");
				}
				
				sb.deleteCharAt(sb.length()-1);
				
				sb.append(" ] },");
				
			}
			
			sb.deleteCharAt(sb.length()-1);
			
			sb.append(" ] },");
			
		}
		
		sb.deleteCharAt(sb.length()-1);
		
		sb.append(" ] } ");
		
		System.out.println(sb);
		
	}
	
}
