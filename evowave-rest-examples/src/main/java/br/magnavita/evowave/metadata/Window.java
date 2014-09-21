package br.magnavita.evowave.metadata;

import java.util.List;

public class Window {

	private Integer position;
	
	private List<Molecule> molecules;
	
	
	public void setMolecules(List<Molecule> molecules) {
		this.molecules = molecules;
	}
	
	public void setPosition(Integer position) {
		this.position = position;
	}
	
	public List<Molecule> getMolecules() {
		return molecules;
	}
	
	public Integer getPosition() {
		return position;
	}
	
}
