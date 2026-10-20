// A lista do IBGE no servidor: é aqui que se confere se a cidade que chegou existe,
// e com que nome ela fica gravada. Ver `municipios.ts`.

import lista from "./municipios.json";
import { acharMunicipio, prepararIndice, type ListaDeMunicipios, type Municipio } from "./municipios";

const INDICE = prepararIndice(lista as ListaDeMunicipios);

/** O município oficial (nome e UF como o IBGE escreve), ou `null` se não for um. */
export function municipioOficial(cidade: string, uf?: string | null): Municipio | null {
  return acharMunicipio(INDICE, cidade, uf);
}
