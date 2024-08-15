interface IErrorBoxProps {
  errorMSG: string
}
export default function ErrorBox({
  errorMSG
}: IErrorBoxProps) {
  return (
    <>
      {errorMSG}
    </>
  )
}
