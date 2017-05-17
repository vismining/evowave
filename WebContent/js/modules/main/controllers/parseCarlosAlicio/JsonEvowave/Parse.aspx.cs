using Evowave;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class Parse : System.Web.UI.Page
{

    protected void Page_Load(object sender, EventArgs e)
    {
        NodesTeste root = JsonConvert.DeserializeObject<NodesTeste>(File.ReadAllText(@"~\arquivosJson\ACT01.json"));

        var listaEstados = retornarEstados(root.Node);

        var listaAnos = retornarAnos(root.Node);

        List<listaMotivo> listaMotivo = retornarMotivos(root.Node);


        var ano2010 = new List<Node>();
        var ano2011 = new List<Node>();
        var ano2012 = new List<Node>();
        var ano2013 = new List<Node>();
        var ano2014 = new List<Node>();


        foreach (int A in listaAnos)
        {
            if (A == 2010)
                ano2010.AddRange(moleculasPorAno(root.Node, A));

            if (A == 2011)
                ano2011.AddRange(moleculasPorAno(root.Node, A));

            if (A == 2012)
                ano2012.AddRange(moleculasPorAno(root.Node, A));

            if (A == 2013)
                ano2013.AddRange(moleculasPorAno(root.Node, A));

            if (A == 2014)
                ano2014.AddRange(moleculasPorAno(root.Node, A));
        }

        var moleculasPorAcidente2010 = new Dictionary<string, List<Node>>();
        var moleculasPorAcidente2011 = new Dictionary<string, List<Node>>();
        var moleculasPorAcidente2012 = new Dictionary<string, List<Node>>();
        var moleculasPorAcidente2013 = new Dictionary<string, List<Node>>();
        var moleculasPorAcidente2014 = new Dictionary<string, List<Node>>();


        foreach (listaMotivo M in listaMotivo)
        {

            moleculasPorAcidente2010.Add(M.label, moleculasPorMotivo(ano2010, M.label));
            moleculasPorAcidente2011.Add(M.label, moleculasPorMotivo(ano2011, M.label));
            moleculasPorAcidente2012.Add(M.label, moleculasPorMotivo(ano2012, M.label));
            moleculasPorAcidente2013.Add(M.label, moleculasPorMotivo(ano2013, M.label));
            moleculasPorAcidente2014.Add(M.label, moleculasPorMotivo(ano2014, M.label));

        }

        // colors
        // FFFF0000 Tipico
        // FF0000FF Trajeto
        // FFFF00FF Doenca do Trabalho

        Random random = new Random(10);
        int teste = random.Next(1, 10);

        List<Molecula> moleculasCentoOeste = new List<Molecula>();
        List<Molecula> moleculasSul = new List<Molecula>();
        List<Molecula> moleculasSudeste = new List<Molecula>();
        List<Molecula> moleculasNorte = new List<Molecula>();
        List<Molecula> moleculasNordeste = new List<Molecula>();


        List<Node> tipico = getMoleculasCentroOeste(moleculasPorAcidente2010["Tipico"]);
        List<Node> trajeto = getMoleculasCentroOeste(moleculasPorAcidente2010["Trajeto"]);
        List<Node> DoencadoTrabalho = getMoleculasCentroOeste(moleculasPorAcidente2010["DoencaDoTrabalho"]);

        string stringCentroOesteTipico = getStringEvowave(random, new List<Molecula>(), tipico, "FFFF0000", 1);
        string stringCentroOesteTrajeto = getStringEvowave(random, new List<Molecula>(), trajeto, "FF0000FF", 2);
        string stringCentroOesteDoencadoTrabalho = getStringEvowave(random, new List<Molecula>(), DoencadoTrabalho, "FFFF00FF", 3);

        tipico = getMoleculasNorte(moleculasPorAcidente2010["Tipico"]);
        trajeto = getMoleculasNorte(moleculasPorAcidente2010["Trajeto"]);
        DoencadoTrabalho = getMoleculasNorte(moleculasPorAcidente2010["DoencaDoTrabalho"]);

        string stringNorteTipico = getStringEvowave(random, moleculasNorte, tipico, "FFFF0000", 1);
        string stringNorteTrajeto = getStringEvowave(random, moleculasNorte, trajeto, "FF0000FF", 2);
        string stringNorteDoencadoTrabalho = getStringEvowave(random, moleculasNorte, DoencadoTrabalho, "FFFF00FF", 3);

        tipico = getMoleculasNordeste(moleculasPorAcidente2010["Tipico"]);
        trajeto = getMoleculasNordeste(moleculasPorAcidente2010["Trajeto"]);
        DoencadoTrabalho = getMoleculasNordeste(moleculasPorAcidente2010["DoencaDoTrabalho"]);

        string stringNordesteTipico = getStringEvowave(random, moleculasNordeste, tipico, "FFFF0000", 1);
        string stringNordesteTrajeto = getStringEvowave(random, moleculasNordeste, trajeto, "FF0000FF", 2);
        string stringNordesteDoencadoTrabalho = getStringEvowave(random, moleculasNordeste, DoencadoTrabalho, "FFFF00FF", 3);

        tipico = getMoleculasSul(moleculasPorAcidente2010["Tipico"]);
        trajeto = getMoleculasSul(moleculasPorAcidente2010["Trajeto"]);
        DoencadoTrabalho = getMoleculasSul(moleculasPorAcidente2010["DoencaDoTrabalho"]);

        string stringSulTipico = getStringEvowave(random, moleculasSul, tipico, "FFFF0000", 1);
        string stringSulTrajeto = getStringEvowave(random, moleculasSul, trajeto, "FF0000FF", 2);
        string stringSulDoencadoTrabalho = getStringEvowave(random, moleculasSul, DoencadoTrabalho, "FFFF00FF", 3);

        tipico = mgetMoleculasSudeste(moleculasPorAcidente2010["Tipico"]);
        trajeto = mgetMoleculasSudeste(moleculasPorAcidente2010["Trajeto"]);
        DoencadoTrabalho = mgetMoleculasSudeste(moleculasPorAcidente2010["DoencaDoTrabalho"]);

        string stringSuldesteTipico = getStringEvowave(random, moleculasSudeste, tipico, "FFFF0000", 1);
        string stringSuldesteTrajeto = getStringEvowave(random, moleculasSudeste, trajeto, "FF0000FF", 2);
        string stringSuldesteDoencadoTrabalho = getStringEvowave(random, moleculasSudeste, DoencadoTrabalho, "FFFF00FF", 3);



        string tasddsad = string.Empty;

    }

    private string getStringEvowave(Random random, List<Molecula> moleculasRegiao, List<Node> lista, string color, int complexity)
    {
        foreach (Node n in lista)
        {
            int qtdDados = n.QteAcidentes;

            for (int i = 1; i <= 10; i++)
            {
                Molecula molecula = new Molecula();
                molecula.color = color;
                molecula.posicao = random.Next(1, 10);

                for (int j = 0; j <= random.Next(1, qtdDados); j++)
                {
                    Dados dado = new Dados();
                    dado.Complexity = random.Next(1, 3);
                    dado.LOC = n.Ano;


                    molecula.dados.Add(dado);

                }

                moleculasRegiao.Add(molecula);

            }

        }

        //[{"position":1,"molecules":[ {"color":"FFFF0000","data":{"complexity":2,"LOC":500}}]}]

        //[{"position":1,"molecules":[{"color":"FFFF00FF","data":{"complexity":"Doenca Do Trabalho","LOC":2010}}]}]

        //[{"position":1,"molecules":[{"color":"FFFF00FF","data":{"complexity":"Doenca Do Trabalho","LOC":2010}},{"color":"FFFF00FF","data":{"complexity":"Doenca Do Trabalho","LOC":2010}}] }]


        string formatadaInicio = string.Empty;
        string formatadaFinal = string.Empty;

        

        foreach (Molecula mol in moleculasRegiao)
        {
            int countDados = 0;

            formatadaInicio = "{ 'position': " + mol.posicao + ",'molecules':[ ";
            
            foreach (Dados d in mol.dados)
            {
                formatadaInicio += "{ 'color':'" + mol.color + "','data':{ 'complexity':" + complexity + ",'LOC':" + d.LOC + "} }";

                countDados++;

                if (countDados < mol.dados.Count)
                {
                    formatadaInicio += " , ";
                }
            }

            formatadaInicio += "]},";

            formatadaFinal += formatadaInicio;
            formatadaInicio = string.Empty;

        }

        return formatadaFinal;
    }






    private List<Node> moleculasPorAno(List<Node> list, int ano)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.Ano == ano)
            {
                lista.Add(n);
            }
        }
        return lista;
    }

    private List<Node> moleculasPorUF(List<Node> list, string uf)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.UF.Equals(uf))
            {
                lista.Add(n);
            }
        }
        return lista;
    }

    private List<Node> moleculasPorMotivo(List<Node> list, string motivo)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.Motivo.Equals(motivo))
            {
                lista.Add(n);
            }
        }
        return lista;
    }

    private List<Node> getMoleculasNorte(List<Node> list)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.UF.Equals("Acre") || n.UF.Equals("Amazonas") || n.UF.Equals("Rondonia") || n.UF.Equals("Roraima")
                || n.UF.Equals("Para") || n.UF.Equals("Amapa") || n.UF.Equals("Tocantins"))
            {
                lista.Add(n);
            }
        }
        return lista;
    }

    private List<Node> getMoleculasNordeste(List<Node> list)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.UF.Equals("Bahia") || n.UF.Equals("Piaui") || n.UF.Equals("Maranhao") || n.UF.Equals("Ceara")
                || n.UF.Equals("Sergipe") || n.UF.Equals("Alagoas") || n.UF.Equals("Pernambuco") || n.UF.Equals("Paraida")
                || n.UF.Equals("Rio Grande do Norte"))
            {
                lista.Add(n);
            }
        }
        return lista;
    }

    private List<Node> getMoleculasSul(List<Node> list)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.UF.Equals("Rio Grande do Sul") || n.UF.Equals("Santa Catarina") || n.UF.Equals("Parana"))
            {
                lista.Add(n);
            }
        }
        return lista;
    }

    private List<Node> mgetMoleculasSudeste(List<Node> list)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.UF.Equals("Sao Paulo") || n.UF.Equals("Rio de Janeiro") || n.UF.Equals("Espirito Santo")
                || n.UF.Equals("Minas Gerais"))
            {
                lista.Add(n);
            }
        }
        return lista;
    }

    private List<Node> getMoleculasCentroOeste(List<Node> list)
    {
        List<Node> lista = new List<Node>();

        foreach (Node n in list)
        {
            if (n.UF.Equals("Mato Grosso") || n.UF.Equals("Mato Grosso do Sul") || n.UF.Equals("Goias")
                || n.UF.Equals("Distrito Federal"))
            {
                lista.Add(n);
            }
        }
        return lista;
    }


    private List<String> retornarEstados(List<Node> list)
    {
        List<String> lista = new List<String>();

        foreach (Node n in list)
        {
            if (!lista.Contains(n.UF))
            {
                lista.Add(n.UF);
            }
        }
        return lista;
    }

    private List<int> retornarAnos(List<Node> list)
    {
        List<int> lista = new List<int>();

        foreach (Node n in list)
        {
            if (!lista.Contains(n.Ano))
            {
                lista.Add(n.Ano);
            }
        }
        return lista;
    }

    private List<listaMotivo> retornarMotivos(List<Node> list)
    {
        List<string> lista = new List<string>();

        foreach (Node n in list)
        {
            if (!lista.Contains(n.Motivo))
            {
                lista.Add(n.Motivo);
            }
        }

        List<listaMotivo> motivos = new List<listaMotivo>();


        foreach (string n in lista)
        {
            listaMotivo lm = new listaMotivo();
            lm.angle = 0.40;
            lm.label = n;

            motivos.Add(lm);
        }




        return motivos;
    }
}