import { renderToBuffer } from '@react-pdf/renderer'
import {
  IndividualEngagementLetterDocument, CompanyEngagementLetterDocument,
  type IndividualLetterFields, type CompanyLetterFields,
} from './EngagementLetterPdf'

export async function generateEngagementLetterPdf(
  type: 'individual' | 'company',
  fields: IndividualLetterFields | CompanyLetterFields
): Promise<Buffer> {
  const doc = type === 'individual'
    ? <IndividualEngagementLetterDocument f={fields as IndividualLetterFields} />
    : <CompanyEngagementLetterDocument f={fields as CompanyLetterFields} />
  return renderToBuffer(doc)
}
