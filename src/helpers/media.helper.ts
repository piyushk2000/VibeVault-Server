
export const mapMediaData = (mediaData: any) => {
    return {
        apiId: mediaData.apiId,
        title: mediaData.title,
        description: mediaData.description,
        genres: mediaData.genres,
        image: mediaData.image,
        type: mediaData.type,
        meta: mediaData.meta,
    };
};