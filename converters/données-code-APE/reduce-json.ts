import { writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

import { Data as RawApeData } from '../données-NAF-CPF-APE/convert-pdf.js'
import rawApeData from '../données-NAF-CPF-APE/output.json' assert { type: 'json' }
import { Out as EtablissementsData } from '../nombre-etablissements-par-code-ape-et-departement/convert-json.js'
import rawEtablissementsData from '../nombre-etablissements-par-code-ape-et-departement/output.json' assert { type: 'json' }

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const OUTPUT_JSON_PATH = join(__dirname, './output.json')
const OUTPUT_MIN_JSON_PATH = join(__dirname, './output.min.json')

const apeData = rawApeData as RawApeData[]
const etablissementsData = rawEtablissementsData as EtablissementsData

interface ApeData {
	codeApe: string
	title: string
	data: string[]
	contenuCentral: string[]
	contenuAnnexe: string[]
	contenuExclu: string[]
}

type NbEtablissement2021Index = number

export interface Output {
	/**
	 * Données textuel pour chaque code APE
	 */
	apeData: ApeData[]

	/**
	 * Nombre d'établissement par département et par code APE,
	 * l'index de ce tableau correspond au index dans indexByCodeApe et indexByCodeDepartement.
	 * Cela permet de trouver le nombre d'établissement en 2021 avec un couple code APE + code d'un département.
	 */
	nbEtablissements2021: number[]
	indexByCodeApe: { [codeAPE: string]: NbEtablissement2021Index[] }
	indexByCodeDepartement: {
		[codeDepartement: string]: NbEtablissement2021Index[]
	}
}

const sousClasses = apeData.filter(({ type }) => type === 'sousClasse')

const index: Record<string, number> = sousClasses.reduce(
	(obj, val, i) => ({ ...obj, [val.code]: i }),
	{}
)

const addContenuExcluToContenuCentral: number[][] = []
const output: Output = {
	apeData: sousClasses.map(
		(
			{
				code: codeApe,
				title,
				data,
				contenuCentral,
				contenuAnnexe,
				contenuExclu,
			},
			i
		) => {
			contenuExclu.forEach((exclu, j) => {
				const match = exclu.match(/\(cf\. (?:([0-9A-Z.]+)(?:, )?)+\)/)
				if (match) {
					const codes = [...match]
					codes.shift()
					codes
						.map((k) => index?.[k])
						.filter((x) => typeof x !== 'undefined')
						.forEach((index) => {
							addContenuExcluToContenuCentral.push([i, j, index])
						})
				}
			})

			return {
				codeApe,
				title,
				data,
				contenuCentral,
				contenuAnnexe,
				contenuExclu,
			}
		}
	),
	nbEtablissements2021: etablissementsData.data.map(
		({ nombre_d_etablissements_2021: nbEtablissements }) => nbEtablissements
	),
	indexByCodeApe: etablissementsData.indexByCodeApe,
	indexByCodeDepartement: etablissementsData.indexByCodeDepartement,
}

addContenuExcluToContenuCentral.forEach(([i, j, index]) => {
	output.apeData[index].contenuCentral.push(output.apeData[i].contenuExclu[j])
})

writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2))
writeFileSync(OUTPUT_MIN_JSON_PATH, JSON.stringify(output))
