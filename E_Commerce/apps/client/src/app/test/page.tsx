import {auth} from "@clerk/nextjs/server"

const TestPage = async () => {
    const { getToken } = await auth()
    const token = await getToken()
    console.log(token)
    // =====================================================================
    // Product Authentication
    // =====================================================================
    const resProduct = await fetch("http://localhost:8000/test" , {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    const dataProduct = await resProduct.json()
    console.log("Response from product service:", dataProduct)
    // =====================================================================
    // Order Authentication
    // =====================================================================
    const resOrder = await fetch("http://localhost:8001/test" , {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    const dataOrder = await resOrder.json()
    console.log("Response from order service:", dataOrder)
    // =====================================================================
    // Payment Authentication
    // =====================================================================
    const resPayment = await fetch("http://localhost:8002/test" , {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    const dataPayment = await resPayment.json()
    console.log("Response from payment service:", dataPayment)

    return <div>
        <h1>Test Page</h1>
    </div>
}
export default TestPage


