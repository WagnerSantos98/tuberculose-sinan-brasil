# Dicionário de códigos SINAN
UF = {"11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO", "21": "MA", "22": "PI",
      "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA", "31": "MG", "32": "ES",
      "33": "RJ", "35": "SP", "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF"}
NOME_UF = {"RO": "Rondônia", "AC": "Acre", "AM": "Amazonas", "RR": "Roraima", "PA": "Pará", "AP": "Amapá",
           "TO": "Tocantins", "MA": "Maranhão", "PI": "Piauí", "CE": "Ceará", "RN": "Rio Grande do Norte",
           "PB": "Paraíba", "PE": "Pernambuco", "AL": "Alagoas", "SE": "Sergipe", "BA": "Bahia",
           "MG": "Minas Gerais", "ES": "Espírito Santo", "RJ": "Rio de Janeiro", "SP": "São Paulo",
           "PR": "Paraná", "SC": "Santa Catarina", "RS": "Rio Grande do Sul", "MS": "Mato Grosso do Sul",
           "MT": "Mato Grosso", "GO": "Goiás", "DF": "Distrito Federal"}
REGIAO = {"1": "Norte", "2": "Nordeste", "3": "Sudeste", "4": "Sul", "5": "Centro-Oeste"}
ORDEM_REGIOES = ["Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"]
SIM_NAO = {"1": "Sim", "2": "Não", "9": "Ignorado"}

DIC = {
    "CS_SEXO": {"M": "Masculino", "F": "Feminino", "I": "Ignorado"},
    "CS_RACA": {"1": "Branca", "2": "Preta", "3": "Amarela", "4": "Parda", "5": "Indígena", "9": "Ignorado"},
    "CS_ESCOL_N": {"0": "Até fund. incompleto", "1": "Até fund. incompleto", "2": "Até fund. incompleto",
                   "3": "Até fund. incompleto", "4": "Fund. completo / médio inc.", "5": "Fund. completo / médio inc.",
                   "6": "Médio completo ou mais", "7": "Médio completo ou mais", "8": "Médio completo ou mais",
                   "9": "Ignorado", "10": "Não se aplica"},
    "TRATAMENTO": {"1": "Caso novo", "2": "Recidiva", "3": "Reingresso após abandono", "4": "Não sabe",
                   "5": "Transferência", "6": "Pós-óbito"},
    "FORMA": {"1": "Pulmonar", "2": "Extrapulmonar", "3": "Pulmonar + extrapulmonar"},
    "HIV": {"1": "Positivo", "2": "Negativo", "3": "Em andamento", "4": "Não realizado"},
    "BACILOSC_E": {"1": "Positiva", "2": "Negativa", "3": "Não realizada", "4": "Não se aplica"},
    "TEST_MOLEC": {"1": "Detectável, sensível RIF", "2": "Detectável, resistente RIF", "3": "Não detectável",
                   "4": "Inconclusivo", "5": "Não realizado"},
    "SITUA_ENCE": {"1": "Cura", "2": "Abandono", "3": "Óbito por TB", "4": "Óbito por outras causas",
                   "5": "Transferência", "6": "Mudança de diagnóstico", "7": "TB-DR", "8": "Mudança de esquema",
                   "9": "Falência", "10": "Abandono primário"},
}

BINARIAS = {"AGRAVAIDS": "aids", "AGRAVALCOO": "alcool", "AGRAVDIABE": "diabetes", "AGRAVDOENC": "doenca_mental",
            "AGRAVDROGA": "drogas", "AGRAVTABAC": "tabagismo", "POP_RUA": "pop_rua", "POP_LIBER": "pop_liberdade",
            "POP_SAUDE": "prof_saude", "POP_IMIG": "imigrante", "BENEF_GOV": "benef_gov"}

ROTULOS_BINARIAS = {"tabagismo": "Tabagismo", "alcool": "Alcoolismo", "drogas": "Drogas ilícitas", "aids": "Aids",
                    "pop_liberdade": "Privado de liberdade", "diabetes": "Diabetes",
                    "benef_gov": "Beneficiário de transferência de renda", "pop_rua": "Em situação de rua",
                    "doenca_mental": "Doença mental", "prof_saude": "Profissional de saúde", "imigrante": "Imigrante"}

FAIXAS = ["0–14", "15–24", "25–34", "35–44", "45–54", "55–64", "65+"]