package br.magnavita.evowave.metadata;

import java.util.List;

public class Sector {

	private String background;
	
	private Double angle;
	
	private List<Window> windows;
		
	
	public void setAngle(Double angle) {
		this.angle = angle;
	}
		
	public void setWindows(List<Window> windows) {
		this.windows = windows;
	}
	
	public Double getAngle() {
		return angle;
	}
	
	public List<Window> getWindows() {
		return windows;
	}
	
	public void setBackground(String background) {
		this.background = background;
	}
	
	public String getBackground() {
		return background;
	}
	
}
