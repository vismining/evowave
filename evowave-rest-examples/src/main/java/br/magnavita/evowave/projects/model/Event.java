package br.magnavita.evowave.projects.model;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class Event {

	private String name;
	
	private String description;
	
	private Date when;
	
	private Map<Attribute, AttributeValue> data;
	
	public void setData(Map<Attribute, AttributeValue> data) {
		this.data = data;
	}
	
	public void setWhen(Date when) {
		this.when = when;
	}
	
	public Map<Attribute, AttributeValue> getData() {
		if(this.data == null)
			this.data = new HashMap<Attribute, AttributeValue>();
		return data;
	}
	
	public Date getWhen() {
		return when;
	}
	
	public void setDescription(String description) {
		this.description = description;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public String getDescription() {
		return description;
	}
	
	public String getName() {
		return name;
	}
	
}
