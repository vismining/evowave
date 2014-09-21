package br.magnavita.evowave.metadata;

import java.util.List;

public class Evowave {

	private Configuration config;
	
	private List<Sector> sectors;

	public void setSectors(List<Sector> sectors) {
		this.sectors = sectors;
	}
	
	public List<Sector> getSectors() {
		return sectors;
	}
	
	public void setConfig(Configuration config) {
		this.config = config;
	}
	
	public Configuration getConfig() {
		return config;
	}
	
}
