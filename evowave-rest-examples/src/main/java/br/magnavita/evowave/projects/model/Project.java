package br.magnavita.evowave.projects.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Project {

	private String title;
	
	private Date starts;
	
	private Date ends;
	
	private List<Event> events;
	
	public void setEnds(Date ends) {
		this.ends = ends;
	}
	
	public void setEvents(List<Event> events) {
		this.events = events;
	}
	
	public void setStarts(Date starts) {
		this.starts = starts;
	}
	
	public void setTitle(String title) {
		this.title = title;
	}
	
	public Date getEnds() {
		return ends;
	}
	
	public List<Event> getEvents() {
		if(this.events == null)
			this.events = new ArrayList<Event>();
		return events;
	}
	
	public Date getStarts() {
		return starts;
	}
	
	public String getTitle() {
		return title;
	}
	
	
}
