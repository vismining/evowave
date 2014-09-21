package br.magnavita.evowave.projects.model;

public abstract class Attribute {

	private Attribute parent;
	
	private String name;
	
	private String description;
	
	private AttributeType type;
	
	public void setParent(Attribute parent) {
		this.parent = parent;
	}
	
	public Attribute getParent() {
		return parent;
	}
	
	public void setDescription(String description) {
		this.description = description;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public void setType(AttributeType type) {
		this.type = type;
	}
	
	public String getDescription() {
		return description;
	}
		
	public String getName() {
		return name;
	}
	
	public AttributeType getType() {
		return type;
	}
	
	
}
